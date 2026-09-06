# Image Editor Architecture

## Layers

| Layer | Files | Responsibility |
| --- | --- | --- |
| Core cropper | `src/image-editor/core/` | Pure state, camera math, containment, source-region, transforms, and canvas export. |
| React cropper | `src/image-editor/react/` | DOM measurement, interaction hooks, overlays, stencil rendering, and the pure `useCropperReducer` hook. |
| Media editor state | `src/state/` | Composite state for the media editor: cropper state, crop options, undo/redo, and gesture boundaries. |

The cropper layer does not own editor history. History belongs to the composite media editor controller because sidebar controls and cropper gestures need one shared undo stack.

## Coordinate Spaces

| Space | What lives here | Coordinates |
| --- | --- | --- |
| World | Image and crop rectangle | Normalized 0-1, origin at the top-left of the image. |
| Camera | Pan, zoom, rotation, and flip transform | `mat2d` mapping world to screen. |
| Screen | DOM container, pointer events, CSS transforms | Pixels relative to the cropper canvas. |
| Viewport | Display-only pan/zoom of the cropper stage | CSS pixels; does not affect export. |

## Data Flow

`MediaEditorState` delegates cropper actions to `cropperReducer()`. Containment keeps the image covering the crop rectangle. React components measure the DOM and render the resulting state.

## Design Decisions

### Containment

Restriction logic projects crop corners through the camera and checks that they stay inside the image.

### Rendering

The render path uses focused calculations for CSS transforms, stencil placement, dimming, and grid overlays.

### State

The core reducer is framework-agnostic and serializable. React and media-editor layers add DOM measurement, gestures, undo/redo, save behavior, and UI state.

### Viewport

Viewport pan/zoom lets the user inspect or follow the crop area without changing the crop output. It is not part of export and should not create undo entries.

## Internal Integration Points

These APIs let code inside `@wordpress/media-editor` compose the cropper. They are not supported extension points for themes or plugins.

| Task | API |
| --- | --- |
| Alternate crop UI inside media-editor | `stencil` prop implementing `StencilProps`. |
| Programmatic edits | `TransformOperation[]`, `applyOperation`, or `stateFromPipeline`. |
| Crop data for REST requests | `getSourceRegion()` and `getSourceRegionPercent()`. |
| Canvas export | `exportCroppedImage()` or `applyToCanvas()`. |
| Shared cropper state across internal components | `CropperProvider` / `useCropper()`. |
| Media editor history | `useMediaEditorState()` composite controller. |
