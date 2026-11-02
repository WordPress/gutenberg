# Cropper Architecture

## Layers

| Layer | Files | Responsibility |
| --- | --- | --- |
| Core cropper | `src/core/` | Pure state, camera math, containment, source-region, transforms, and canvas export. |
| React cropper | `src/react/` | DOM measurement, interaction hooks, overlays, stencil rendering, and the pure `useCropperController` hook. |
| Crop session | `src/state/` | `useCropSession`: undo and redo, gesture boundaries, crop options and the default aspect-ratio presets. |
| Server instructions | `src/build-modifiers.ts` | Turns the crop into the rotate, flip and crop instructions the WordPress media REST endpoint expects. |
| Deprecated cropper | `src/legacy/` | The older cropper built on `react-easy-crop`. Nothing outside this folder imports it. |

`useCropperController` has no undo and redo. `useCropSession` adds them: the cropper state and crop options go through one reducer and one history stack, so a control such as the aspect-ratio preset and a crop gesture share one undo stack. A wider state can join the same history by passing its own reducer, which handles its own actions and passes the rest to `cropSessionReducer`. The media editor does this for its named edits.

## Coordinate Spaces

| Space | What lives here | Coordinates |
| --- | --- | --- |
| World | Image and crop rectangle | Normalized 0-1, origin at the top-left of the image. |
| Camera | Pan, zoom, rotation, and flip transform | `mat2d` mapping world to screen. |
| Screen | DOM container, pointer events, CSS transforms | Pixels relative to the cropper canvas. |
| Viewport | Display-only pan/zoom of the cropper stage | CSS pixels; does not affect export. |

## Data Flow

State code that wraps the cropper delegates cropper actions to `cropperReducer()`. Containment keeps the image covering the crop rectangle. React components measure the DOM and render the resulting state.

## Design Decisions

### Containment

Restriction logic projects crop corners through the camera and checks that they stay inside the image.

### Rendering

The render path uses focused calculations for CSS transforms, stencil placement, dimming, and grid overlays.

### State

The core reducer is framework-agnostic and serializable. The React layer adds DOM measurement and gestures. `useCropSession` adds undo and redo on top. Saving and editor UI state belong to the code that uses the cropper.

### Viewport

Viewport pan/zoom lets the user inspect or follow the crop area without changing the crop output. It is not part of export and should not create undo entries.

## Extension Points

| Task | API |
| --- | --- |
| Alternate crop area shape | `stencil` prop implementing `StencilProps`. |
| Crop data for REST requests | `getSourceRegion()`, `getSourceRegionPercent()` and `buildModifiers()`. |
| Export in the browser | `controller.getCroppedImage()` or `exportCroppedImage()`. |
| Shared cropper state across components | `CropperProvider` / `useCropper()`. |
