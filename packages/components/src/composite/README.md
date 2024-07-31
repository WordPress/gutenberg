# `Composite`

`Composite` provides a single tab stop on the page and allows navigation through the focusable descendants with arrow keys. This abstract component is based on the [WAI-ARIA Composite Role⁠](https://w3c.github.io/aria/#composite).

See the [Ariakit docs for the `Composite` component](https://ariakit.org/components/composite).

## Usage

```jsx
const useCompositeStore = useCompositeStore();
const store = useCompositeStore();
<Composite store={store}>
  <Composite.Group>
    <Composite.GroupLabel>Label</Composite.GroupLabel>
    <Composite.Item>Item 1</Composite.Item>
    <Composite.Item>Item 2</Composite.Item>
  </CompositeGroup>
</Composite>
```

## Components

### `Composite`

Renders a composite widget.

See the [Ariakit docs for the `Composite` component](https://ariakit.org/reference/composite).

### `Composite.Group`

Renders a group element for composite items.

See the [Ariakit docs for the `CompositeGroup` component](https://ariakit.org/reference/composite-group).

### `Composite.GroupLabel`

Renders a label in a composite group. This component must be wrapped with `Composite.Group` so the `aria-labelledby` prop is properly set on the composite group element.

See the [Ariakit docs for the `CompositeGroupLabel` component](https://ariakit.org/reference/composite-group-label).

### `Composite.Item`

Renders a composite item.

See the [Ariakit docs for the `CompositeItem` component](https://ariakit.org/reference/composite-item).

### `Composite.Row`

Renders a composite row. Wrapping `Composite.Item` elements within `Composite.Row` will create a two-dimensional composite widget, such as a grid.

See the [Ariakit docs for the `CompositeItem` component](https://ariakit.org/reference/composite-row).
