# Hero portrait model

The hero currently loads `public/models/jedidiah-bust-2.glb`. If the selected model is unavailable, it uses `public/hero-portrait.webp`. Change `activeModelFile` in `src/components/HeroScene.astro` to switch samples.

## Installed portrait

The supplied `sample_2.glb` is installed separately as `jedidiah-bust-2.glb`, a textured, 24-part assembly (32,785 triangles; 2,256,544 bytes). It retains its source orientation with no added root rotation and uses nonmetallic skin/cloth material. The first sample's −90° Y correction was removed after the user's screenshot showed it turned this sample sideways. Missing normals are computed on the original mesh before partitioning to keep lighting continuous across fragment boundaries. Browser confirmation is left to the user.

The previous `sample.glb` remains at `public/models/jedidiah-bust.glb` unchanged (30,797 triangles; 2,107,984 bytes). Set `activeModelFile` to `jedidiah-bust.glb` to restore it. See `public/models/README.md` for source details. Both original downloads are unchanged.

## Generate and prepare

`scripts/hero-model.py` runs on Python 3.9+ with the standard library. It uses Meshy's image-to-3D API for reconstruction and prepares assembly fragments locally. Blender is not required. Generation uploads the supplied portrait to Meshy and consumes API credits; the default command only previews the request.

1. Convert the existing WebP to PNG using the project's installed Sharp dependency:

   ```sh
   mkdir -p /tmp/hero-model
   bun --eval 'import sharp from "sharp"; await sharp("public/hero-portrait.webp").png().toFile("/tmp/hero-model/portrait.png");'
   python3 scripts/hero-model.py generate /tmp/hero-model/portrait.png
   ```

2. Set `MESHY_API_KEY` in your local terminal environment using your secret manager. Do not paste keys into chat, commit them, or include them in commands saved to shell history. Meshy API credits are separate from web-app credits. Review the current [API pricing](https://docs.meshy.ai/en/api/pricing) before submitting.

3. Submit one generation request:

   ```sh
   python3 scripts/hero-model.py generate /tmp/hero-model/portrait.png --submit
   ```

   The request uses Meshy 7.1 standard, a textured 2K PBR GLB, and a 30,000-triangle remesh target. The CLI prints a task ID and saves a receipt at `/tmp/hero-model/task.json`. A receipt prevents accidentally submitting the same request twice. If submission times out, check Meshy's task history before creating another request; a job may already exist. Receipts live in temporary storage, so retain the task ID elsewhere if needed.

4. Replace `TASK_ID` below with the returned ID. Fetching resumes the existing job; it does not create a generation job:

   ```sh
   python3 scripts/hero-model.py fetch TASK_ID
   python3 scripts/hero-model.py prepare /tmp/hero-model/raw.glb --parts 24
   python3 scripts/hero-model.py validate /tmp/hero-model/prepared.glb
   ```

   Fetch polls for up to 30 minutes. Run it again if the job is still running. `--wait 0` checks once. Commands refuse to overwrite an existing output; use a new `--output` path for a revision.

5. Inspect likeness, head/shoulder crop, orientation, textures, and assembly motion before committing the asset. After review, install the prepared model:

   ```sh
   mkdir -p public/models
   cp -i /tmp/hero-model/prepared.glb public/models/jedidiah-bust.glb
   ```

   Preview the homepage with the managed development server (`astro dev --background`). The runtime normalizes model size. Use glTF's Y-up orientation with the face toward +Z; if the face points backward, adjust the portrait component's model yaw. Geometry that includes a background plane or unwanted full body needs cleanup before preparation.

The local preparation step groups existing triangles into spatial fragments and recenters their pivots. It preserves UVs, materials, embedded images, parent transforms, and authored normals. When normals are missing, it computes area-weighted vertex normals before splitting. It **does not** improve facial likeness, remove backgrounds, or cap the exposed edges of separated fragments. For thick, solid pieces during the exploded state, author capped fragments in a modeling tool instead.

## Runtime contract

- Binary glTF 2.0, at most 12 MiB, one scene, embedded buffers and textures.
- 8–120 independent rigid fragment roots with unique names. Name each `frag_…` or set `extras.assemblyPart` to `true`. Do not nest tagged roots.
- Every mesh belongs to a fragment; all fragments contain nonempty geometry.
- Static triangles, no animation clips, skinning, morph targets, cameras, or lights.
- No Draco, Meshopt, BasisU compression, or GPU instancing. The local preparation tool supports ordinary non-sparse vertex accessors and one embedded binary buffer.
- An optional numeric `extras.assemblyDelay` on a fragment controls its entrance delay; the renderer otherwise derives a stable delay from its name.

Validation checks structure, not visual quality or likeness. Test the actual model in the browser, including replay, reduced motion, narrow screens, and the fallback when WebGL is unavailable.

## Fully local alternative

[Hunyuan3D-2](https://github.com/Tencent-Hunyuan/Hunyuan3D-2) documents approximately 6 GB VRAM for shape generation and 16 GB for shape plus texture. It is a substantial setup for this 8 GB Mac. [TripoSR](https://github.com/VAST-AI-Research/TripoSR) offers a local image-to-mesh CLI with texture baking, but also requires model downloads and additional dependencies. Neither is installed by this workflow. Their GLB output still needs preparation and visual review.

API request details: [Meshy image-to-3D documentation](https://docs.meshy.ai/en/api/image-to-3d).

Offline checks:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p 'test_hero_model.py' -v
```
