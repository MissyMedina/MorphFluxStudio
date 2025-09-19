## Image Omni-Guide: Mastering Image Generation Interactions

## Introduction

This guide covers modern image generation and editing tools. These tools are often multimodal (understand text + images) and support: text-to-image, text-driven edits (add/remove/replace), inpainting/outpainting, combining multiple images, accurate text rendering, stylized art/stickers, minimalist designs, and photorealistic product photography/mocks. Use this as your assistant prompt and workflow playbook to consistently achieve high fidelity and high efficacy across use cases.

Use this guide the same way you’d use a design or photo brief: provide complete context, specify intent, describe constraints, and iterate with tight feedback loops. Prefer full sentences over keyword soups.

## Core Principles

### 1) Context First
- **Goal**: What are you trying to make? (ad key visual, logo, product hero, social post, concept art, storyboard frame, UI asset)
- **Audience & Use**: Where will it be used? (web, print, mobile) Any brand guidelines?
- **Format & Specs**: Aspect ratio, resolution, file format, transparent/solid background.
- **Style Intent**: Photoreal vs illustration; art movement or medium; mood.
- **Constraints**: Must-have elements, must-avoid elements (negatives), licensing or safety boundaries.

### 2) Describe, Don’t List
- Prefer complete sentences. “A dark forest at night illuminated by magical fireflies” outperforms “forest, night, magic”.
- Be explicit about subjects, actions, environment, materials, lighting, camera, and composition.

### 3) Constrain Scope in Edits
- For edits, say “only change X; keep everything else identical” to preserve identity, lighting, and layout.
- For multi-step changes, sequence them: “First … Then …”

### 4) Iterate in Small Deltas
- Generate → critique → revise. Adjust 1–3 variables at a time (lighting, angle, palette, detail density).
- Use the same seed (if available) for controlled variations; nudge composition or style gradually.

### 5) Be Reproducible
- Fix: aspect ratio, background, lighting style, camera metaphors, and color palette. Reuse reference phrases.
- For multi-image identity consistency, mention “same subject/character as the provided image; preserve facial features, hair, outfit.”

## Prompt Design Frameworks

### Universal Prompt Skeleton (TSSC-CCD-ON)
- **T**ask/Intent: the purpose of the image.
- **S**ubject(s): who/what; identity traits; pose/action.
- **S**cene: environment, era, weather, props.
- **C**amera: shot type (wide/medium/close/macro), angle (eye-level/low/high), lens (mm), focus/DoF.
- **C**hiaroscuro (Lighting): type, direction, softness, time-of-day, mood.
- **D**esign/Style: medium (photo, watercolor, vector, pixel), art movement, rendering style.
- **O**utput Specs: aspect ratio, background (transparent/white/scene), resolution.
- **N**egatives: explicit exclusions (artifacts, watermarks, extra limbs, text gibberish, blur, low-res).

Template:
```
Create [purpose]. A [shot type] of [subject] [action] in [scene].
Lighting: [type/direction/time]; Mood: [adjectives]. Camera: [lens mm, angle, DoF].
Style: [medium/style/artist-like cues]; Palette: [colors/hex].
Output: [aspect ratio], [background], [resolution if needed].
Exclude: [negatives].
```

### Edit-Only Skeleton (Scope + Fidelity)
```
Using the provided image of [subject/scene], change only [target element] to [new description].
Preserve the original [lighting, composition, textures, identity, colors] everywhere else.
Output: [aspect ratio/background]. Exclude: [negatives].
```

### Combine-Images Skeleton (Source → Target)
```
Combine the provided images: place [element from image A] with/on [element from image B].
Match lighting/shadows and perspective for realism. Final scene: [describe].
Output: [aspect ratio/background]. Exclude: [negatives].
```

### Text-in-Image Skeleton (Accuracy First)
```
Create a [design type] with the text "[exact text]" in a [font/style].
Place the text [layout/position/integration]. Palette: [colors].
Output: [aspect ratio/background]. Exclude: [mis-spelling, warped text].
```

## Workflow Patterns

- **Two-Pass Approach**: Pass 1 composition + lighting; Pass 2 detail tuning (materials, microtexture, color accents).
- **Mask-Then-Modify**: For surgical edits, constrain to the target element (“only the sofa”); keep everything else identical.
- **Variant Ladder**: Keep seed constant; vary 1 parameter per iteration (angle → light → palette → texture).
- **Reference Anchoring**: Reuse consistent phrases across prompts to anchor identity and style.

## Use Cases with Templates and Examples

### 1) Text-to-Image (Photoreal)
Template:
```
A photorealistic [shot type] of [subject], [action/expression], in [environment].
Lighting: [description] creating a [mood] atmosphere. Camera: [lens mm/angle/DoF].
Emphasize [key textures/details]. Output: [aspect ratio/orientation]. Exclude: [negatives].
```
Example:
```
A photorealistic close-up portrait of an elderly Japanese ceramicist with a warm, knowing smile, carefully inspecting a freshly glazed tea bowl in a rustic workshop. Lighting: soft golden hour through a side window, highlighting clay texture. Camera: 85mm portrait lens, shallow depth of field with creamy bokeh. Mood: serene and masterful. Output: vertical portrait. Exclude: text artifacts, watermark, oversharpening.
```
Tip: To shift style, swap camera and lighting cues (e.g., “wide-angle street market at noon, vibrant colors, smartphone camera”).

### 2) Image Editing with Text
- **Add/Remove Elements**
Template:
```
Using the provided image of [subject], please [add/remove/modify] [element]. Ensure it looks natural: [fit, lighting, shadows, interaction]. Output: [specs].
```
Example (Add):
```
Using the provided image of my cat, add a small knitted wizard hat on its head. Make it sit comfortably and match the soft indoor lighting. Output: original aspect ratio; exclude: artifacts.
```

- **Inpainting (Specific Area Only)**
Template:
```
Using the provided image, change only the [specific element] to [new description]. Keep everything else exactly the same: [lighting, composition, colors]. Output: [specs].
```
Example:
```
Using the provided image of a living room, change only the blue sofa to a vintage brown leather chesterfield. Keep pillows, lighting, and layout identical. Output: original ratio.
```

- **Style Transfer**
Template:
```
Transform the provided photograph of [subject/scene] into the artistic style of [artist/art style]. Preserve composition; render with [stylized elements]. Output: [specs].
```
Example:
```
Transform the provided city street at night into the style of Vincent van Gogh’s "Starry Night": swirling impasto strokes, deep blues and bright yellows, composition preserved. Output: landscape 16:9.
```

### 3) Combining Multiple Images
Template:
```
Create a new image by combining provided inputs. Put the [element from image 1] onto/with the [element from image 2].
Generate a realistic, full-body view; adjust lighting and shadows to match [environment]. Output: [specs].
```
Example:
```
Create a professional e-commerce fashion photo. Take the blue floral dress from image 1 and have the woman from image 2 wear it. Outdoor lighting with matched shadows; full-body shot. Output: 4:5 portrait.
```

### 4) Text Rendering and Accurate Placement
Guidelines:
- Put exact text in quotes.
- Specify font/class (“bold sans-serif”, “handwritten script”, “stencil”, “monospace”).
- Describe placement/integration (“wrapped on a mug”, “on a street sign at top-left”, “baseline aligned with icon”).

Template:
```
Create a [design] for [brand/concept] with the text "[Exact Text]" in a [font/style].
Design: [minimalist/retro/modern]; Include [icon/shape] integrated with text. Palette: [colors]. Output: [specs].
```
Example:
```
Create a modern minimalist logo for a coffee shop called "The Daily Grind". Text in clean, bold sans-serif; integrate a simple coffee bean icon with the letters. Colors: black and white. Output: square with transparent background. Exclude: warped text.
```

### 5) Stylized Illustrations and Stickers
Template:
```
A [style] sticker/illustration of a [subject], featuring [key characteristics] and [palette].
Line art: [bold/clean/sketchy]; Shading: [flat/cel/watercolor]. Background: [white/transparent].
```
Example:
```
A kawaii-style sticker of a happy red panda wearing a tiny bamboo hat, munching a green leaf. Bold clean outlines, simple cel-shading, vibrant palette. Background: white.
```

### 6) Product Photography and Mockups
Template:
```
A high-resolution, studio-lit product photograph of a [product] on a [surface/background].
Lighting: [three-point/softbox/diffused] to [effect]. Camera: [angle] to showcase [feature].
Ultra-realistic; sharp focus on [detail]. Output: [aspect ratio].
```
Example:
```
A high-resolution, studio-lit photo of a minimalist matte-black ceramic coffee mug on polished concrete. Lighting: three-point softboxes for soft highlights and minimal shadows. Camera: slightly elevated 45° to show clean lines. Sharp focus on steam rising from coffee. Output: 1:1 square.
```

### 7) Minimalist Designs
Template:
```
A minimalist composition with [primary subject] on [clean background].
Generous negative space for [copy/logo]. Subtle texture: [paper grain/soft gradient]. Palette: [limited colors]. Output: [specs].
```
Example:
```
A minimalist background for a landing hero: soft off-white gradient, faint paper grain, a small abstract geometric shape at lower-right. Plenty of negative space for headline. Output: 16:9.
```

## Advanced Controls and Levers

- **Aspect Ratio**: 1:1 (square), 4:5 (portrait), 3:2, 16:9 (landscape), banners (21:9). State explicitly.
- **Resolution**: Request “high-resolution” or specify target (e.g., 2048 px on the long edge). Use upscaling post-step if available.
- **Camera Language**: wide/medium/close/macro; low/high/eye-level angle; focal lengths (24/35/50/85/135mm); aperture metaphors (shallow vs deep DoF); bokeh character (creamy/circular).
- **Lighting Language**: golden hour, overcast softbox, hard noon, rim light, backlight, volumetric shafts, practicals (lamps/neon), HDR studio.
- **Composition**: rule of thirds, centered symmetry, leading lines, negative space, foreground elements, frame-within-frame.
- **Materials**: matte vs glossy, metallic roughness, subsurface scattering (skin/wax), translucency, caustics, micro-scratches, patina.
- **Palette**: complementary/analogous/triadic; name colors or give hex codes; specify “muted”, “pastel”, “high contrast”.
- **Background**: solid white/black, transparent, paper texture, studio sweep, in-scene environment.
- **Negatives**: text artifacts, extra fingers/limbs, warped anatomy, lens dirt, watermark, oversharpening, low-res, banding.
- **Identity Consistency**: “same subject as provided image; preserve face structure, hair style/color, outfit, accessories.”
- **Seeds/Variations**: keep seed fixed to preserve composition; vary by one parameter per iteration for controlled exploration.

## Quality Assurance and Troubleshooting

- **Text looks wrong**: put exact text in quotes; increase font clarity; increase contrast; simplify background; generate the text element first, then integrate.
- **Faces/hands off**: request symmetrical face, centered framing; specify “two hands, five fingers each”; increase resolution and lighting quality.
- **Subject drift between edits**: anchor “same subject/character” and list invariant traits (hair, facial marks, outfit); avoid global style changes when editing small parts.
- **Lighting mismatch in composites**: describe light direction/softness for both elements; add “match shadows and white balance.”
- **Overcrowded or busy**: reduce number of props; add “minimalist composition; generous negative space.”
- **Perspective issues**: state camera angle and horizon level; request orthographic/isometric if needed.
- **Artifacts**: add negatives (watermark, text artifacts, noise); simplify textures; soften lighting.

## Communication Framework (for working with the assistant)

### Request Structure
1. **Context**: purpose, audience, brand, platform.
2. **Assets**: attach reference images; note which is A/B/C; specify what each contributes.
3. **Target**: what a “good” output looks like (style, composition, mood, fidelity).
4. **Specs**: aspect ratio, background, resolution, file format.
5. **Constraints**: must-have/must-avoid, safety/ethics.
6. **Plan**: single pass or multi-pass (composition then detail), number of variations.

Example request:
```
Context: social hero image for a coffee brand; clean modern aesthetics.
Assets: image A (brand mug), image B (concrete background texture).
Target: photoreal product hero with soft rim light and steam; minimalist composition.
Specs: 16:9, 2560×1440, transparent background if possible.
Constraints: avoid visible logos other than ours; no text artifacts.
Plan: 1 base composition + 3 controlled variations; keep seed fixed.
```

### Response Optimization
- Propose multiple approaches (photo-real vs stylized), note trade-offs.
- Explain which variables to tweak first (angle/light) vs later (microtexture/color accents).
- Present concise templates; include a single high-signal example.

## Quick Reference Templates

- **Photoreal Portrait**
```
A photoreal [shot] of [person] [expression] in [place]. Lighting: [desc]. Camera: [mm, angle, DoF]. Mood: [adj]. Output: [ratio]. Exclude: [negatives].
```
- **Add/Remove**
```
Using the provided image of [subject], [add/remove] [element] with natural [fit/lighting/shadows]. Only this change; keep all else identical. Output: [specs].
```
- **Inpaint**
```
Change only the [area/element] to [new description]; preserve [lighting/composition/colors] elsewhere. Output: [specs].
```
- **Combine**
```
Put the [element from A] onto/with [element from B]; match lighting and perspective; final scene: [desc]. Output: [specs].
```
- **Logo/Text**
```
[Design type] with text "[Exact]" in [font/style]; place [layout]; palette [colors]; output [specs]; exclude [warping/misspelling].
```
- **Sticker**
```
[Style] sticker of [subject], [traits], [palette]; lines [style]; shading [style]; background [white/transparent].
```
- **Product Photo**
```
Studio-lit photo of [product] on [surface]; lighting [setup/effect]; camera [angle/feature]; ultra-real; focus on [detail]; output [ratio].
```
- **Minimalist Background**
```
Minimal background with [subtle motif]; generous negative space for copy; [texture/gradient]; output [ratio].
```

## Superhuman Cheat Codes

- **Anchor Phrases**: Reuse the same identity/style anchors to stabilize outputs (e.g., “soft golden-hour side light”, “matte ceramic with subtle microtexture”).
- **One-Knob Iteration**: Change exactly one variable per round; compare variants side-by-side.
- **Composition First**: Nail framing and light direction before micro-details; details amplify good composition, not fix it.
- **Hard Negatives**: Maintain a standing negatives list you copy into prompts (artifacts, warped text, extra limbs, watermark, low-res, oversharpening).
- **Seed Discipline**: Fix seed for exploration; switch seeds only when composition space is exhausted.
- **Reference Triad**: Subject identity, lighting, and background: keep two fixed while changing one.

## Appendix A: Visual Vocabulary

- **Shot Types**: establishing/wide, medium, close-up, macro.
- **Angles**: eye-level, low, high, top-down, Dutch tilt.
- **Lenses**: 24/35/50/85/135mm (wider → more context; longer → compression/bokeh).
- **Lighting**: key/fill/rim; softbox; backlight; golden hour; overcast; neon; volumetric.
- **Composition**: rule of thirds, symmetry, leading lines, negative space, frame-within-frame.
- **Materials**: matte, glossy, rough, metallic, translucent, SSS, patina.

## Appendix B: Standing Negatives (copy-paste)
```
Exclude: text artifacts, watermark, extra fingers/limbs, warped anatomy, distorted perspective, low resolution, excessive noise, heavy banding, oversharpening, chromatic aberration.
```

## Appendix C: Iteration Script (use in chat)
```
1) What works: [list]
2) What to change: [1–3 precise changes]
3) Keep fixed: [identity/lighting/background]
4) New output: [specs]
```

By following this guide and iterating deliberately, you’ll reliably produce high-fidelity, purpose-fit images across photoreal scenes, precise edits, text-integrated designs, stylized illustrations, and production-ready product visuals.
