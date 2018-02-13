# withDragging

`withDragging` is a React [higher-order component](https://facebook.github.io/react/docs/higher-order-components.html) provides dragStart and dragEnd properties to the component being wrapped. When used, a cross-browser drag image is created. The component clones the specified element on drag-start and uses the clone as a drag image during drag-over. Discards the clone on drag-end.

- See `block-list/layout` and `block-list/block` for example use.
- Provides "dragStart" and "dragEnd" handlers as properties to the wrapped component.
- These can be used on any draggable element and the effect will be the same.
- Styling and drop handlers implemented by the consuming component.
