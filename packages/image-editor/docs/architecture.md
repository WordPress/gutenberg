# Image Editor Architecture

How the image editor works inside, for people changing this package. To use it, see the [README](/packages/image-editor/README.md) and the [recipes](/packages/image-editor/docs/recipes.md).

## Layers

| Layer | Files | Responsibility |
| --- | --- | --- |
| Core | `src/core/` | Pure state, camera math, containment, source-region, transforms, and canvas export. |
| React | `src/react/` | The canvas (`ImageEditorCanvas`), DOM measurement, interaction hooks, overlays, stencil rendering, and the `useImageEditor` hook. |
| Saving | `src/map-edit-to-original.ts` | Describes the flip, rotate and crop operations to apply to the full-size loaded image. |

The editor keeps no undo history. History belongs to the code that uses the editor, because it covers everything that code edits, not only the crop. The consumer keeps the state: `useImageEditor( { state, onChange } )` works out each change and reports the next state, and marks changes the person did not make (an image loading, a refit after a window resize) with `isEdit: false`. The media editor does this, with its sidebar options and named edits in the same history.

## Public and Internal Types

Two types are wider inside the package than outside it:

| Public | Internal | What the internal one adds |
| --- | --- | --- |
| `ImageEditorState` | `InternalImageEditorState` | The base pan, zoom and rotation the reducer keeps for fine rotation. They are on the stored object, so a state the consumer passes back carries them. |
| `ImageEditorController` | `InternalImageEditorController` | The methods only the canvas calls (`adjustCropRectForViewport`, `settleCrop`, `setZoomAtPoint`). |

The internal types fit where the public ones are expected, so there are only two casts: `useInternalImageEditor` treats the state it receives as the internal one, and `ImageEditorCanvas` treats its controller as the internal one.

`useImageEditor` is `useInternalImageEditor` with the public types. The internal hook can also keep its own state, which the package's tests and debug story use; the public hook always takes the state from the consumer.

## Coordinate Spaces

| Space | What lives here | Coordinates |
| --- | --- | --- |
| World | Points on the loaded image | Normalized 0-1, origin at the top-left of the image. |
| Crop view | `cropRect` and pan | Fractions of the image's bounding box at the nearest 90° rotation, before zoom and pan. |
| Camera | Pan, zoom, rotation, and flip transform | `mat2d` mapping world to screen. |
| Screen | DOM container, pointer events, CSS transforms | Pixels relative to the canvas. |
| Viewport | Display-only pan/zoom of the canvas stage | CSS pixels; does not affect export. |

## Data Flow

Every change goes through `imageEditorReducer()` in `src/core/state.ts`. The hook runs it on the state the consumer keeps (`state` and `onChange`), or on its own state in the package's tests. Containment keeps the image covering the crop rectangle. React components measure the DOM and render the resulting state.

## Design Decisions

### Containment

Restriction logic projects crop corners through the camera and checks that they stay inside the image.

### Rendering

The render path uses focused calculations for CSS transforms, stencil placement, dimming, and grid overlays.

### State

The core reducer is framework-agnostic and serializable. The React layer adds DOM measurement and gestures. Undo and redo, saving, and editor UI state belong to the code that uses the editor.

### Viewport

Viewport pan/zoom lets the user inspect or follow the crop area without changing the crop output. It is not part of export and should not create undo entries.

## Extension Points

| Task | API |
| --- | --- |
| Describe the operations to apply to the loaded image when saving | `mapEditToOriginal()`. |
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
-   `src/react/components/test/image-editor-canvas.browser.test.tsx` for the canvas.
-   `src/react/components/stencils/test/rectangle-stencil.browser.test.tsx` for resize handles.
-   `src/react/hooks/test/use-image-editor.jsdom.test.ts` for the controller, including keeping the state yourself.
-   `src/test/map-edit-to-original.test.ts` for checking the mapped edits against the preview camera on the same image.
