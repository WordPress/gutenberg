# `Composite`

`Composite` provides a single tab stop on the page and allows navigation through the focusable descendants with arrow keys. This abstract component is based on the [WAI-ARIA Composite Role⁠](https://w3c.github.io/aria/#composite).

See the [Ariakit docs for the `Composite` component](https://ariakit.org/components/composite).

## Usage

```jsx
const store = useCompositeStore();
<Composite store={store}>
  <Composite.Group>
    <Composite.GroupLabel>Label</Composite.GroupLabel>
    <Composite.Item>Item 1</Composite.Item>
    <Composite.Item>Item 2</Composite.Item>
  </CompositeGroup>
</Composite>
```

## Hooks

### `useCompositeStore`

Creates a composite store.

#### Props

##### `activeId`: `string | null`

The current active item id. The active item is the element within the composite widget that has either DOM or virtual focus. `null` represents the base composite element (the one with a composite role). Users will be able to navigate out of it using arrow keys.

-   Required: no

##### `defaultActiveId`: `string | null`

The composite item id that should be active by default when the composite widget is rendered. If `null`, the composite element itself will have focus and users will be able to navigate to it using arrow keys. If `undefined`, the first enabled item will be focused.

-   Required: no

##### `setActiveId`: `((activeId: string | null | undefined) => void)`

A callback that gets called when the activeId state changes.

-   Required: no

##### `focusLoop`: `boolean | 'horizontal' | 'vertical' | 'both'`

Determines how the focus behaves when the user reaches the end of the composite widget.

-   Required: no
-   Default: `false`

##### `focusShift`: `boolean`

Works only on two-dimensional composite widgets. If enabled, moving up or down when there's no next item or when the next item is disabled will shift to the item right before it.

-   Required: no
-   Default: `false`

##### `focusWrap`: `boolean`

Works only on two-dimensional composite widgets. If enabled, moving to the next item from the last one in a row or column will focus on the first item in the next row or column and vice-versa.

-   Required: no
-   Default: `false`

##### `virtualFocus`: `boolean`

If enabled, the composite element will act as an aria-activedescendant⁠ container instead of roving tabindex⁠. DOM focus will remain on the composite element while its items receive virtual focus. In both scenarios, the item in focus will carry the data-active-item attribute.

-   Required: no
-   Default: `false`

##### `orientation`: `'horizontal' | 'vertical' | 'both'`

Defines the orientation of the composite widget. If the composite has a single row or column (one-dimensional), the orientation value determines which arrow keys can be used to move focus. It doesn't have any effect on two-dimensional composites.

-   Required: no
-   Default: `'both'`

##### `rtl`: `boolean`

Determines how the next and previous functions will behave. If rtl is set to true, they will be inverted. This only affects the composite widget behavior. You still need to set dir=`rtl` on HTML/CSS.

-   Required: no
-   Default: `false`

## Components

### `Composite`

Renders a composite widget.

#### Props

##### `store`: `CompositeStore<CompositeStoreItem>`

Object returned by the `useCompositeStore` hook.

-   Required: yes

##### `render`: `RenderProp<React.HTMLAttributes<any> & { ref?: React.Ref<any> | undefined; }> | React.ReactElement<any, string | React.JSXElementConstructor<any>>`

Allows the component to be rendered as a different HTML element or React component. The value can be a React element or a function that takes in the original component props and gives back a React element with the props merged.

-   Required: no

##### `children`: `React.ReactNode`

The contents of the component.

-   Required: no

### `Composite.Group`

Renders a group element for composite items.

##### `render`: `RenderProp<React.HTMLAttributes<any> & { ref?: React.Ref<any> | undefined; }> | React.ReactElement<any, string | React.JSXElementConstructor<any>>`

Allows the component to be rendered as a different HTML element or React component. The value can be a React element or a function that takes in the original component props and gives back a React element with the props merged.

-   Required: no

##### `children`: `React.ReactNode`

The contents of the component.

-   Required: no

### `Composite.GroupLabel`

Renders a label in a composite group. This component must be wrapped with `Composite.Group` so the `aria-labelledby` prop is properly set on the composite group element.

##### `render`: `RenderProp<React.HTMLAttributes<any> & { ref?: React.Ref<any> | undefined; }> | React.ReactElement<any, string | React.JSXElementConstructor<any>>`

Allows the component to be rendered as a different HTML element or React component. The value can be a React element or a function that takes in the original component props and gives back a React element with the props merged.

-   Required: no

##### `children`: `React.ReactNode`

The contents of the component.

-   Required: no

### `Composite.Item`

Renders a composite item.

##### `render`: `RenderProp<React.HTMLAttributes<any> & { ref?: React.Ref<any> | undefined; }> | React.ReactElement<any, string | React.JSXElementConstructor<any>>`

Allows the component to be rendered as a different HTML element or React component. The value can be a React element or a function that takes in the original component props and gives back a React element with the props merged.

-   Required: no

##### `children`: `React.ReactNode`

The contents of the component.

-   Required: no

### `Composite.Row`

Renders a composite row. Wrapping `Composite.Item` elements within `Composite.Row` will create a two-dimensional composite widget, such as a grid.

##### `render`: `RenderProp<React.HTMLAttributes<any> & { ref?: React.Ref<any> | undefined; }> | React.ReactElement<any, string | React.JSXElementConstructor<any>>`

Allows the component to be rendered as a different HTML element or React component. The value can be a React element or a function that takes in the original component props and gives back a React element with the props merged.

-   Required: no

##### `children`: `React.ReactNode`

The contents of the component.

-   Required: no
