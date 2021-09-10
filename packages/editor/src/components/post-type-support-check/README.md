# PostTypeSupportCheck

A component which renders its own children only if the current editor post type supports one of the given `supportKeys`.

## Usage

Render PostTypeSupportCheck with children and one or more `supportKeys`. The children will be displayed if the post type supports at least one of the keys.

```jsx
<PostTypeSupportCheck supportKeys="title">Supported</PostTypeSupportCheck>
```

If the post type is not yet known, it will be assumed to be supported.

## Props

### `children`

_Type:_ `WPElement`

Children to be rendered if post type supports.

### `supportKeys`

_Type:_ `string|string[]`

String or string array of keys to test.
