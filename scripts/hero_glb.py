"""Prepare static triangle GLBs for the hero, preserving UVs/materials and local pivots.

Spatial partitioning separates existing triangles; it does not reconstruct a face,
close cut surfaces, retopologize, or repair an AI-generated model's likeness.
"""
import copy
import json
import math
from pathlib import Path
import re
import struct

LIMIT = 12 * 1024 * 1024
COMPONENTS = {5120: "b", 5121: "B", 5122: "h", 5123: "H", 5125: "I", 5126: "f"}
WIDTHS = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}


def load(path):
    data = Path(path).read_bytes()
    if len(data) < 20 or struct.unpack_from("<4sII", data) != (b"glTF", 2, len(data)):
        raise ValueError("Expected an intact binary glTF 2.0 file.")
    chunks = []
    offset = 12
    while offset < len(data):
        length, kind = struct.unpack_from("<II", data, offset)
        offset += 8
        if length % 4 or offset + length > len(data):
            raise ValueError("Invalid GLB chunk length.")
        chunks.append((kind, data[offset:offset + length]))
        offset += length
    if len(chunks) != 2 or chunks[0][0] != 0x4E4F534A or chunks[1][0] != 0x004E4942:
        raise ValueError("Expected one JSON chunk and one embedded binary chunk.")
    doc = json.loads(chunks[0][1])
    if doc.get("asset", {}).get("version") != "2.0" or len(doc.get("scenes", [])) != 1:
        raise ValueError("Export one glTF 2.0 scene.")
    if len(doc.get("buffers", [])) != 1 or doc["buffers"][0].get("uri"):
        raise ValueError("Embed geometry in a single GLB buffer.")
    binary = chunks[1][1]
    if not 0 <= len(binary) - doc["buffers"][0]["byteLength"] <= 3:
        raise ValueError("GLB binary buffer length does not match its declaration.")
    for image in doc.get("images", []):
        if image.get("uri") and not image["uri"].startswith("data:"):
            raise ValueError("Embed all textures; external image URLs are unsupported.")
    extensions = doc.get("extensionsUsed", []) + doc.get("extensionsRequired", [])
    if any(re.search("draco|meshopt|basisu|gpu_instancing|lights", name, re.I) for name in extensions):
        raise ValueError("Export without compression, instancing, or lights.")
    if doc.get("animations") or doc.get("skins") or doc.get("cameras"):
        raise ValueError("Export rigid geometry without animations, skins, or cameras.")
    return doc, binary


def scene_nodes(doc):
    nodes = doc["nodes"]
    seen = set()
    order = []

    def visit(index, tagged=False):
        if index in seen or not isinstance(index, int) or not 0 <= index < len(nodes):
            raise ValueError("Scene nodes must form a tree with valid references.")
        seen.add(index)
        node = nodes[index]
        if "camera" in node or "skin" in node:
            raise ValueError("Remove cameras and skinning before preparing the model.")
        order.append((index, tagged))
        fragment = node.get("extras", {}).get("assemblyPart") is True or node.get("name", "").lower().startswith("frag_")
        for child in node.get("children", []):
            visit(child, tagged or fragment)

    for root in doc["scenes"][0].get("nodes", []):
        visit(root)
    return order


def accessor(doc, binary, index):
    item = doc["accessors"][index]
    if "sparse" in item or "bufferView" not in item:
        raise ValueError("Sparse/implicit accessors are unsupported; export regular vertex buffers.")
    if item.get("type") not in WIDTHS or item.get("componentType") not in COMPONENTS:
        raise ValueError("Unsupported vertex attribute format.")
    view = doc["bufferViews"][item["bufferView"]]
    if view.get("buffer", 0) != 0 or view.get("extensions"):
        raise ValueError("Unsupported external or compressed buffer view.")
    fmt = "<" + COMPONENTS[item["componentType"]] * WIDTHS[item["type"]]
    size = struct.calcsize(fmt)
    stride = view.get("byteStride", size)
    start = view.get("byteOffset", 0) + item.get("byteOffset", 0)
    count = item["count"]
    end = start + (count - 1) * stride + size
    if count < 1 or stride < size or start < view.get("byteOffset", 0) or end > view.get("byteOffset", 0) + view["byteLength"] or end > len(binary):
        raise ValueError("Accessor extends beyond its buffer view.")
    values = [struct.unpack_from(fmt, binary, start + i * stride) for i in range(count)]
    return item, values


def primitives(doc, binary, mesh_index):
    output = []
    for primitive in doc["meshes"][mesh_index]["primitives"]:
        if primitive.get("mode", 4) != 4 or primitive.get("targets") or primitive.get("extensions"):
            raise ValueError("Prepare static uncompressed triangle primitives only.")
        attributes = {name: accessor(doc, binary, index) for name, index in primitive["attributes"].items()}
        if any(name.startswith(("JOINTS_", "WEIGHTS_")) for name in attributes):
            raise ValueError("Bake skinning into rigid geometry first.")
        meta, positions = attributes["POSITION"]
        if meta["componentType"] != 5126 or meta["type"] != "VEC3" or meta.get("normalized"):
            raise ValueError("POSITION must contain unnormalized float32 VEC3 values.")
        if any(not math.isfinite(v) for row in positions for v in row):
            raise ValueError("Model contains nonfinite positions.")
        if any(len(values) != len(positions) for _, values in attributes.values()):
            raise ValueError("Vertex attribute counts do not match.")
        if "indices" in primitive:
            index_meta, index_values = accessor(doc, binary, primitive["indices"])
            if index_meta["type"] != "SCALAR" or index_meta["componentType"] not in (5121, 5123, 5125):
                raise ValueError("Triangle indices must use unsigned scalar integers.")
            indices = [value[0] for value in index_values]
        else:
            indices = list(range(len(positions)))
        if len(indices) % 3 or not indices or any(i >= len(positions) for i in indices):
            raise ValueError("Invalid triangle indices.")
        triangles = [tuple(indices[i:i + 3]) for i in range(0, len(indices), 3)]
        output.append((primitive, attributes, triangles))
    return output


def partition(faces, count):
    groups = [faces]
    while len(groups) < count:
        group = max(groups, key=len)
        if len(group) < 2:
            break
        groups.remove(group)
        spans = [max(f[2][axis] for f in group) - min(f[2][axis] for f in group) for axis in range(3)]
        axis = max(range(3), key=lambda i: spans[i])
        group.sort(key=lambda f: f[2][axis])
        middle = len(group) // 2
        groups.extend((group[:middle], group[middle:]))
    return groups


def prepare(source, destination, parts=24):
    destination = Path(destination)
    if destination.exists():
        raise ValueError("Output already exists; choose a new --output path.")
    if not 8 <= parts <= 120:
        raise ValueError("Choose between 8 and 120 parts.")
    doc, binary = load(source)
    active = scene_nodes(doc)
    meshes = [(index, primitives(doc, binary, doc["nodes"][index]["mesh"]))
              for index, _ in active if "mesh" in doc["nodes"][index]]
    if not meshes or len(meshes) > 120:
        raise ValueError("Expected 1–120 rigid mesh nodes.")
    allocations = [1] * len(meshes)
    face_counts = [sum(len(p[2]) for p in mesh) for _, mesh in meshes]
    while sum(allocations) < max(parts, len(meshes)):
        candidates = [i for i, total in enumerate(face_counts) if allocations[i] < total]
        if not candidates:
            break
        chosen = max(candidates, key=lambda i: face_counts[i] / allocations[i])
        allocations[chosen] += 1

    out = copy.deepcopy(doc)
    out.update(meshes=[], accessors=[], bufferViews=[], buffers=[], scene=0)
    blob = bytearray()

    def add_view(data, target=None):
        blob.extend(b"\0" * (-len(blob) % 4))
        view = {"buffer": 0, "byteOffset": len(blob), "byteLength": len(data)}
        if target is not None:
            view["target"] = target
        out["bufferViews"].append(view)
        blob.extend(data)
        return len(out["bufferViews"]) - 1

    def add_accessor(meta, values, position=False, indices=False):
        fmt = "<" + COMPONENTS[meta["componentType"]] * WIDTHS[meta["type"]]
        data = b"".join(struct.pack(fmt, *row) for row in values)
        result = {"bufferView": add_view(data, 34963 if indices else 34962),
                  "componentType": meta["componentType"], "type": meta["type"], "count": len(values)}
        if meta.get("normalized"):
            result["normalized"] = True
        if position:
            result["min"] = [min(row[i] for row in values) for i in range(3)]
            result["max"] = [max(row[i] for row in values) for i in range(3)]
        out["accessors"].append(result)
        return len(out["accessors"]) - 1

    for image in out.get("images", []):
        if "bufferView" in image:
            view = doc["bufferViews"][image["bufferView"]]
            start = view.get("byteOffset", 0)
            if view.get("buffer", 0) != 0 or start + view["byteLength"] > len(binary):
                raise ValueError("Invalid embedded image buffer view.")
            image["bufferView"] = add_view(binary[start:start + view["byteLength"]])
    for node in out["nodes"]:
        node.get("extras", {}).pop("assemblyPart", None)
        node.get("extras", {}).pop("assemblyDelay", None)
        if node.get("name", "").lower().startswith("frag_"):
            node["name"] = "source_" + node["name"]
    # Remove unreachable mesh references rather than retaining unused geometry.
    for node in out["nodes"]:
        node.pop("mesh", None)
    part_number = 0
    for (node_index, mesh), count in zip(meshes, allocations):
        faces = []
        for primitive_index, (_, attributes, triangles) in enumerate(mesh):
            positions = attributes["POSITION"][1]
            for triangle in triangles:
                center = tuple(sum(positions[v][axis] for v in triangle) / 3 for axis in range(3))
                faces.append((primitive_index, triangle, center))
        for group in partition(faces, count):
            points = [mesh[p][1]["POSITION"][1][v] for p, triangle, _ in group for v in triangle]
            pivot = [(min(row[i] for row in points) + max(row[i] for row in points)) / 2 for i in range(3)]
            new_primitives = []
            for p in sorted(set(face[0] for face in group)):
                original, attributes, _ = mesh[p]
                triangles = [face[1] for face in group if face[0] == p]
                vertices = sorted(set(v for triangle in triangles for v in triangle))
                remap = {v: i for i, v in enumerate(vertices)}
                new_attributes = {}
                for name, (meta, values) in attributes.items():
                    selected = [values[v] for v in vertices]
                    if name == "POSITION":
                        selected = [tuple(row[i] - pivot[i] for i in range(3)) for row in selected]
                    new_attributes[name] = add_accessor(meta, selected, position=name == "POSITION")
                indices = [(remap[v],) for triangle in triangles for v in triangle]
                primitive = {"attributes": new_attributes, "indices": add_accessor({"componentType": 5125, "type": "SCALAR"}, indices, indices=True), "mode": 4}
                if "material" in original:
                    primitive["material"] = original["material"]
                new_primitives.append(primitive)
            out["meshes"].append({"primitives": new_primitives})
            part_number += 1
            out["nodes"].append({"name": "frag_%03d" % part_number, "mesh": len(out["meshes"]) - 1,
                                 "translation": pivot, "extras": {"assemblyPart": True}})
            out["nodes"][node_index].setdefault("children", []).append(len(out["nodes"]) - 1)
    if not 8 <= part_number <= 120:
        raise ValueError("Not enough geometry for 8–120 fragments.")
    out["buffers"] = [{"byteLength": len(blob)}]
    out["asset"]["generator"] = "personal-site hero-model.py spatial partitioner"
    encoded = json.dumps(out, separators=(",", ":"), allow_nan=False).encode()
    encoded += b" " * (-len(encoded) % 4)
    blob.extend(b"\0" * (-len(blob) % 4))
    size = 12 + 8 + len(encoded) + 8 + len(blob)
    if size > LIMIT:
        raise ValueError("Prepared model exceeds 12 MiB. Reduce source texture resolution or polygon count.")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("xb") as file:
        file.write(struct.pack("<4sII", b"glTF", 2, size))
        file.write(struct.pack("<II", len(encoded), 0x4E4F534A) + encoded)
        file.write(struct.pack("<II", len(blob), 0x004E4942) + blob)


def validate(path):
    doc, binary = load(path)
    if Path(path).stat().st_size > LIMIT:
        raise ValueError("Model exceeds the site's 12 MiB ceiling.")
    fragments = []
    triangles = 0
    for index, ancestor_fragment in scene_nodes(doc):
        node = doc["nodes"][index]
        fragment = node.get("extras", {}).get("assemblyPart") is True or node.get("name", "").lower().startswith("frag_")
        if fragment:
            if ancestor_fragment:
                raise ValueError("Nested fragment roots are unsupported.")
            fragments.append(node.get("name", ""))
        if "mesh" in node:
            if not fragment and not ancestor_fragment:
                raise ValueError("Mesh is outside an assembly fragment. Run prepare first.")
            triangles += sum(len(p[2]) for p in primitives(doc, binary, node["mesh"]))
    if not 8 <= len(fragments) <= 120 or len(set(fragments)) != len(fragments) or "" in fragments:
        raise ValueError("Expected 8–120 uniquely named nonnested assembly fragments.")
    if not triangles:
        raise ValueError("Model has no triangle geometry.")
    return {"file": str(path), "bytes": Path(path).stat().st_size, "fragments": len(fragments),
            "triangles": triangles, "embedded_images": len(doc.get("images", [])),
            "note": "Structural checks only. Inspect likeness, orientation, textures, and assembly in the browser."}
