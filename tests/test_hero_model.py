"""Offline regression tests: no API key, network calls, or generation credits."""
import copy
import importlib.util
import json
from pathlib import Path
import struct
import sys
import tempfile
import unittest
import zlib
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import hero_glb

spec = importlib.util.spec_from_file_location("hero_model", Path(__file__).resolve().parents[1] / "scripts/hero-model.py")
cli = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cli)


def write_fixture(path, interleaved=False, multi_material=False):
    vertices = [(x / 10, y / 10, 0.0) for y in range(5) for x in range(9)]
    normals = [(0.0, 0.0, 1.0)] * len(vertices)
    uvs = [(x / 8, y / 4) for y in range(5) for x in range(9)]
    triangles = []
    for y in range(4):
        for x in range(8):
            v = y * 9 + x
            triangles.extend(((v, v + 1, v + 9), (v + 1, v + 10, v + 9)))
    doc = {"asset": {"version": "2.0"}, "scene": 0, "scenes": [{"nodes": [0]}],
           "nodes": [{"name": "Bust", "translation": [1, 2, 3], "mesh": 0}],
           "meshes": [{"primitives": []}], "buffers": [], "bufferViews": [], "accessors": [],
           "materials": [{"pbrMetallicRoughness": {"baseColorTexture": {"index": 0}}},
                         {"pbrMetallicRoughness": {"baseColorFactor": [0.2, 0.5, 0.7, 1]}}],
           "textures": [{"source": 0}], "images": []}
    blob = bytearray()

    def view(data, stride=None):
        blob.extend(b"\0" * (-len(blob) % 4))
        item = {"buffer": 0, "byteOffset": len(blob), "byteLength": len(data)}
        if stride:
            item["byteStride"] = stride
        doc["bufferViews"].append(item)
        blob.extend(data)
        return len(doc["bufferViews"]) - 1

    def attribute(values, kind, shared=None, offset=0):
        data = b"".join(struct.pack("<" + "f" * len(row), *row) for row in values)
        item = {"componentType": 5126, "type": kind, "count": len(values), "bufferView": shared if shared is not None else view(data), "byteOffset": offset}
        if kind == "VEC3" and values is vertices:
            item.update(min=[0, 0, 0], max=[0.8, 0.4, 0])
        doc["accessors"].append(item)
        return len(doc["accessors"]) - 1

    if interleaved:
        data = b"".join(struct.pack("<8f", *(v + n + uv)) for v, n, uv in zip(vertices, normals, uvs))
        shared = view(data, stride=32)
        attrs = {"POSITION": attribute(vertices, "VEC3", shared), "NORMAL": attribute(normals, "VEC3", shared, 12),
                 "TEXCOORD_0": attribute(uvs, "VEC2", shared, 24)}
    else:
        attrs = {"POSITION": attribute(vertices, "VEC3"), "NORMAL": attribute(normals, "VEC3"), "TEXCOORD_0": attribute(uvs, "VEC2")}
    sets = [triangles[:32], triangles[32:]] if multi_material else [triangles]
    for material, faces in enumerate(sets):
        indices = [v for tri in faces for v in tri]
        idx = len(doc["accessors"])
        doc["accessors"].append({"componentType": 5123, "type": "SCALAR", "count": len(indices),
                                 "bufferView": view(struct.pack("<" + "H" * len(indices), *indices))})
        doc["meshes"][0]["primitives"].append({"attributes": attrs, "indices": idx, "material": material})
    def png_chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))

    png = (b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 6, 0, 0, 0))
           + png_chunk(b"IDAT", zlib.compress(b"\x00\xff\x80\x40\xff")) + png_chunk(b"IEND", b""))
    doc["images"] = [{"bufferView": view(png), "mimeType": "image/png"}]
    write_glb(path, doc, bytes(blob))
    return doc, bytes(blob)


def write_glb(path, doc, blob):
    doc = copy.deepcopy(doc)
    doc["buffers"] = [{"byteLength": len(blob)}]
    encoded = json.dumps(doc).encode()
    encoded += b" " * (-len(encoded) % 4)
    blob += b"\0" * (-len(blob) % 4)
    data = struct.pack("<4sII", b"glTF", 2, 28 + len(encoded) + len(blob))
    Path(path).write_bytes(data + struct.pack("<II", len(encoded), 0x4E4F534A) + encoded + struct.pack("<II", len(blob), 0x004E4942) + blob)


class HeroModelTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.source = self.root / "raw.glb"
        self.output = self.root / "prepared.glb"

    def tearDown(self):
        self.temp.cleanup()

    def test_preparation_preserves_triangles_uvs_materials_and_parent_transform(self):
        for interleaved in (False, True):
            with self.subTest(interleaved=interleaved):
                original, original_blob = write_fixture(self.source, interleaved, multi_material=True)
                self.output.unlink(missing_ok=True)
                hero_glb.prepare(self.source, self.output, 24)
                report = hero_glb.validate(self.output)
                self.assertEqual((report["fragments"], report["triangles"], report["embedded_images"]), (24, 64, 1))
                doc, blob = hero_glb.load(self.output)
                self.assertEqual(doc["materials"], original["materials"])
                self.assertEqual(doc["nodes"][0]["translation"], [1, 2, 3])
                self.assertNotIn("mesh", doc["nodes"][0])
                source_uvs = hero_glb.accessor(original, original_blob, original["meshes"][0]["primitives"][0]["attributes"]["TEXCOORD_0"])[1]
                source_positions = hero_glb.accessor(original, original_blob, original["meshes"][0]["primitives"][0]["attributes"]["POSITION"])[1]
                for node in doc["nodes"][1:]:
                    for _, attrs, _ in hero_glb.primitives(doc, blob, node["mesh"]):
                        for position, uv, normal in zip(attrs["POSITION"][1], attrs["TEXCOORD_0"][1], attrs["NORMAL"][1]):
                            source_index = source_uvs.index(uv)
                            for axis in range(3):
                                self.assertAlmostEqual(position[axis] + node["translation"][axis], source_positions[source_index][axis], places=6)
                            self.assertEqual(normal, (0, 0, 1))
                old_image = original["bufferViews"][original["images"][0]["bufferView"]]
                new_image = doc["bufferViews"][doc["images"][0]["bufferView"]]
                self.assertEqual(blob[new_image["byteOffset"]:new_image["byteOffset"] + new_image["byteLength"]],
                                 original_blob[old_image["byteOffset"]:old_image["byteOffset"] + old_image["byteLength"]])

    def test_rejects_unsupported_models_and_protects_existing_output(self):
        doc, blob = write_fixture(self.source)
        with self.assertRaisesRegex(ValueError, "outside an assembly fragment"):
            hero_glb.validate(self.source)
        invalid = copy.deepcopy(doc)
        invalid["animations"] = [{}]
        write_glb(self.source, invalid, blob)
        with self.assertRaisesRegex(ValueError, "animations"):
            hero_glb.prepare(self.source, self.output)
        write_glb(self.source, doc, blob)
        hero_glb.prepare(self.source, self.output)
        content = self.output.read_bytes()
        with self.assertRaisesRegex(ValueError, "already exists"):
            hero_glb.prepare(self.source, self.output)
        self.assertEqual(content, self.output.read_bytes())

    def test_generation_preview_never_contacts_provider(self):
        image = self.root / "portrait.png"
        image.write_bytes(b"\x89PNG\r\n\x1a\nfixture")
        with patch.object(sys, "argv", ["hero-model.py", "generate", str(image)]), patch.object(cli, "request") as request, patch("builtins.print"):
            cli.main()
            request.assert_not_called()

    def test_missing_key_does_not_create_submission_receipt(self):
        image = self.root / "portrait.png"
        image.write_bytes(b"\x89PNG\r\n\x1a\nfixture")
        receipt = self.root / "task.json"
        with patch.dict("os.environ", {}, clear=True), patch.object(sys, "argv", ["hero-model.py", "generate", str(image), "--submit", "--task-file", str(receipt)]), patch("builtins.print"):
            with self.assertRaisesRegex(ValueError, "MESHY_API_KEY"):
                cli.main()
        self.assertFalse(receipt.exists())


if __name__ == "__main__":
    unittest.main()
