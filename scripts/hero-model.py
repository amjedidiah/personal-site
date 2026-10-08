#!/usr/bin/env python3
"""Image-to-3D CLI. Python 3.9+, standard library only; no implicit paid requests."""
import argparse
import base64
import json
import os
from pathlib import Path
import struct
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlparse
from urllib.request import Request, urlopen

from hero_glb import prepare, validate

API = "https://api.meshy.ai/openapi/v1/image-to-3d"


def image_uri(path):
    data = Path(path).read_bytes()
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        mime = "image/png"
    elif data.startswith(b"\xff\xd8\xff"):
        mime = "image/jpeg"
    else:
        raise ValueError("Meshy accepts PNG/JPEG. Convert the WebP portrait with the documented Sharp command first.")
    return "data:" + mime + ";base64," + base64.b64encode(data).decode("ascii")


def request(path="", payload=None):
    key = os.environ.get("MESHY_API_KEY", "").strip()
    if not key:
        raise ValueError("Set MESHY_API_KEY in your terminal environment; never put it in source control.")
    req = Request(API + path, data=json.dumps(payload).encode() if payload is not None else None,
                  headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
    try:
        with urlopen(req, timeout=90) as response:
            return json.load(response)
    except HTTPError as error:
        # Do not echo provider response bodies, request images, keys, or signed URLs.
        hints = {401: "Check MESHY_API_KEY.", 402: "Insufficient generation credits.", 429: "Rate limited; retry the existing task later."}
        raise ValueError("Meshy HTTP %s. %s" % (error.code, hints.get(error.code, "Check the API request/status."))) from None
    except (URLError, TimeoutError) as error:
        raise ValueError("Network request did not complete. If submitting, check your Meshy task history before retrying; the job may exist.") from None


def download(task_id, output, wait_seconds):
    output = Path(output)
    if output.exists():
        raise ValueError("Output already exists; choose a new --output path.")
    deadline = time.monotonic() + wait_seconds
    last_status = None
    while True:
        task = request("/" + quote(task_id, safe=""))
        status = task.get("status")
        progress = task.get("progress", 0)
        current = (status, progress)
        if current != last_status:
            print("%s: %s%%" % current, flush=True)
            last_status = current
        if status == "SUCCEEDED":
            break
        if status in ("FAILED", "CANCELED"):
            raise ValueError("Generation %s. Inspect this task in Meshy before creating another." % status.lower())
        if status not in ("PENDING", "IN_PROGRESS"):
            raise ValueError("Unrecognized task status: %r" % status)
        if time.monotonic() >= deadline:
            raise ValueError("Task still running. Resume with: python3 scripts/hero-model.py fetch " + task_id)
        time.sleep(min(5, max(0, deadline - time.monotonic())))
    url = task.get("model_urls", {}).get("glb")
    if not url or urlparse(url).scheme != "https":
        raise ValueError("Task returned no HTTPS GLB download URL.")
    # Authorization goes only to the Meshy API, never to an asset/CDN URL.
    try:
        with urlopen(url, timeout=120) as response:
            data = response.read(64 * 1024 * 1024 + 1)
    except (HTTPError, URLError, TimeoutError):
        raise ValueError("GLB download failed; run fetch again to get a fresh download URL.") from None
    if len(data) > 64 * 1024 * 1024:
        raise ValueError("Download exceeds 64 MiB; reduce geometry/texture size at the provider.")
    if len(data) < 20 or data[:4] != b"glTF" or struct.unpack_from("<II", data, 4) != (2, len(data)):
        raise ValueError("The downloaded file is not a binary glTF 2.0 asset.")
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("xb") as file:
        file.write(data)
    print("Downloaded raw model to %s. Run prepare before installing it." % output)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    generate = commands.add_parser("generate", help="Preview a request; --submit uploads the image and consumes credits")
    generate.add_argument("image", type=Path)
    generate.add_argument("--submit", action="store_true", help="Explicitly create one paid generation task")
    generate.add_argument("--task-file", type=Path, default=Path("/tmp/hero-model/task.json"))
    generate.add_argument("--polycount", type=int, default=30000)
    fetch = commands.add_parser("fetch", help="Resume/poll an existing task and download its raw GLB")
    fetch.add_argument("task_id")
    fetch.add_argument("--output", default="/tmp/hero-model/raw.glb")
    fetch.add_argument("--wait", type=int, default=1800, help="Maximum polling seconds; 0 checks once")
    prep = commands.add_parser("prepare", help="Partition a rigid GLB into spatial assembly fragments locally")
    prep.add_argument("input", type=Path)
    prep.add_argument("--output", type=Path, default=Path("/tmp/hero-model/prepared.glb"))
    prep.add_argument("--parts", type=int, default=24)
    check = commands.add_parser("validate", help="Check the site's GLB contract; does not judge likeness")
    check.add_argument("input", type=Path)
    args = parser.parse_args()

    if args.command == "generate":
        if not 100 <= args.polycount <= 300000:
            parser.error("--polycount must be between 100 and 300000")
        payload = {"image_url": image_uri(args.image), "ai_model": "meshy-7.1", "model_type": "standard",
                   "should_texture": True, "enable_pbr": True, "texture_resolution": "2k",
                   "should_remesh": True, "topology": "triangle", "target_polycount": args.polycount,
                   "image_enhancement": False, "pose_mode": "", "target_formats": ["glb"]}
        summary = dict(payload, image_url="<local portrait: %s>" % args.image)
        print(json.dumps(summary, indent=2))
        if not args.submit:
            print("Preview only. No image uploaded, no credits consumed. Add --submit to create one job.")
            return
        if args.task_file.exists():
            raise ValueError("Task file exists. Resume that task or choose a new --task-file to avoid duplicate charges.")
        if not os.environ.get("MESHY_API_KEY", "").strip():
            raise ValueError("Set MESHY_API_KEY in your terminal environment before submitting.")
        args.task_file.parent.mkdir(parents=True, exist_ok=True)
        # Reserve the receipt before submission; even an ambiguous timeout blocks an accidental repeat.
        with args.task_file.open("x") as receipt:
            json.dump({"status": "submission-pending", "image": str(args.image)}, receipt)
        response = request(payload=payload)
        task_id = response.get("result")
        if not isinstance(task_id, str) or not task_id:
            raise ValueError("Submission returned no task ID. Check Meshy task history before retrying.")
        args.task_file.write_text(json.dumps({"task_id": task_id, "image": str(args.image)}, indent=2) + "\n")
        print("Created task %s; receipt: %s" % (task_id, args.task_file))
        print("Download: python3 scripts/hero-model.py fetch " + task_id)
    elif args.command == "fetch":
        if args.wait < 0:
            parser.error("--wait cannot be negative")
        download(args.task_id, args.output, args.wait)
    elif args.command == "prepare":
        prepare(args.input, args.output, args.parts)
        print(json.dumps(validate(args.output), indent=2))
    else:
        print(json.dumps(validate(args.input), indent=2))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, KeyError, IndexError, struct.error) as error:
        print("Error: " + str(error), file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("Stopped. Resume an existing task with fetch; do not submit it again.", file=sys.stderr)
        sys.exit(130)
