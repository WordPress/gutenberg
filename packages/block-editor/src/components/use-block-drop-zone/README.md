# useBlockDropZone

`useBlockDropZone` is a React hook used to specify a drop zone for a block. This drop zone supports the drag and drop of media into the editor.

## Props

### dropZoneName

-   Type: `string`
-   Required: No

An optional name for the dropzone. Note that if a name is provided then only `<BlockDraggable>`s that specify this name in their `targets` prop will be able to be dropped.
