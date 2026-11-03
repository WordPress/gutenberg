# Image Editor Architecture

How the cropper works inside, for people changing this package. To use it, see the [README](../../README.md) and the [recipes](recipes.md).

## Layers

| Layer | Files | Responsibility |
| --- | --- | --- |
| Core cropper | `src/core/` | Pure state, camera math, containment, source-region, transforms, and canvas export. |
| React cropper | `src/react/` | DOM measurement, interaction hooks, overlays, stencil rendering, and the pure `useCropperController` hook. |
| Steps for the original | `src/get-steps-for-original.ts` | Turns the edit into the flip, rotate and crop steps that make the full-size original match it. |

The editor keeps no undo history. History belongs to the code that uses the editor, because it covers everything that code edits, not only the crop. The consumer keeps the state: `useImageEditor( { state, onChange } )` works out each change and reports the next state, and marks changes the person did not make (an image loading, a refit after a window resize) with `isEdit: false`. The media editor does this, with its sidebar options and named edits in the same history.

## Public Names

`src/image-editor.ts` gives the public names and types, and points them at the cropper code, which keeps the names it had in the media editor:

| Public | Inside the package |
| --- | --- |
| `ImageEditorCanvas` | `Cropper` |
| `useImageEditor` | `useCropperController` |
| `ImageEditorState` | `CropperState` |
| `ImageEditorController` | `CropperController` |
| `createImageEditorState` | `createCropperState` |
| `areImageEditorStatesEqual` | `areCropperStatesEqual` |

The public types are narrower. `ImageEditorState` leaves out the base pan, zoom and rotation the reducer keeps for fine rotation, though they stay on the stored object. `ImageEditorController` leaves out the methods the canvas calls (`setVisualSize`, `adjustCropRectForViewport`, `settleCrop`, `setZoomAtPoint`), and `getCroppedImage`. `useCropperController` can still keep its own state, which the package's tests and debug story use; the public hook always takes the state from the consumer.

## Coordinate Spaces

| Space | What lives here | Coordinates |
| --- | --- | --- |
| World | Image and crop rectangle | Normalized 0-1, origin at the top-left of the image. |
| Camera | Pan, zoom, rotation, and flip transform | `mat2d` mapping world to screen. |
| Screen | DOM container, pointer events, CSS transforms | Pixels relative to the cropper canvas. |
| Viewport | Display-only pan/zoom of the cropper stage | CSS pixels; does not affect export. |

## Data Flow

Every change goes through `cropperReducer()` in `src/core/state.ts`. `useCropperController` runs it on the state the consumer keeps (`state` and `onChange`), or on its own state in the package's tests. Containment keeps the image covering the crop rectangle. React components measure the DOM and render the resulting state.

## Design Decisions

### Containment

Restriction logic projects crop corners through the camera and checks that they stay inside the image.

### Rendering

The render path uses focused calculations for CSS transforms, stencil placement, dimming, and grid overlays.

### State

The core reducer is framework-agnostic and serializable. The React layer adds DOM measurement and gestures. Undo and redo, saving, and editor UI state belong to the code that uses the cropper.

### Viewport

Viewport pan/zoom lets the user inspect or follow the crop area without changing the crop output. It is not part of export and should not create undo entries.

## Extension Points

| Task | API |
| --- | --- |
| Save the edit to the original image | `getStepsForOriginal()`. |
| Keep the edit in your own undo history | `useImageEditor( { state, onChange } )`, `createImageEditorState()` and `areImageEditorStatesEqual()`. |
| Build zoom and rotation controls | `controller.minZoom`, `controller.maxZoom` and `controller.maxRotationOffset`. |

## Tests

Run focused unit tests with:

```bash
npm run test:unit -- packages/image-editor
```

Useful test areas:

-   `src/core/test/camera.ts` for containment and camera invariants.
-   `src/core/test/state.ts` for reducer behavior.
-   `src/core/export/test/canvas-renderer.jsdom.test.ts` for canvas export.
-   `src/react/components/test/cropper.browser.test.tsx` for React cropper behavior.
-   `src/react/components/stencils/test/rectangle-stencil.browser.test.tsx` for resize handles.
-   `src/react/hooks/test/use-cropper-controller.jsdom.test.ts` for the controller, including keeping the state yourself.
-   `src/test/get-steps-for-original.test.ts` for the steps for the original: what the preview shows is what the steps produce.
