# Block Supports

Block Supports is the API that allows a block to declare features used in the editor.

_Some [block supports](#supports-optional) — for example, `anchor` or `className` — apply their attributes by adding additional props on the element returned by `save`. This will work automatically for default HTML tag elements (`div`, etc). However, if the return value of your `save` is a custom component element, you will need to ensure that your custom component handles these props in order for the attributes to be persisted._

## anchor

-   `anchor` (default `false`): Anchors let you link directly to a specific block on a page. This property adds a field to define an id for the block and a button to copy the direct link.

```js
// Add the support for an anchor link.
anchor: true,
```

## align

-   `align` (default `false`): This property adds block controls which allow to change block's alignment. _Important: It doesn't work with dynamic blocks yet._

```js
// Add the support for block's alignment (left, center, right, wide, full).
align: true,
// Pick which alignment options to display.
align: [ 'left', 'right', 'full' ],
```

When supports align is used the block attributes definition is extended to include an align attribute with a string type.
By default, no alignment is assigned to the block.
The block can apply a default alignment by specifying its own align attribute with a default e.g.:

```
attributes: {
	...
	align: {
		type: 'string',
		default: 'right'
	},
	...
}
```

## alignWide

-   `alignWide` (default `true`): This property allows to enable [wide alignment](/docs/designers-developers/developers/themes/theme-support.md#wide-alignment) for your theme. To disable this behavior for a single block, set this flag to `false`.

```js
// Remove the support for wide alignment.
alignWide: false,
```

## className

-   `className` (default `true`): By default, the class `.wp-block-your-block-name` is added to the root element of your saved markup. This helps having a consistent mechanism for styling blocks that themes and plugins can rely on. If for whatever reason a class is not desired on the markup, this functionality can be disabled.

```js
// Remove the support for the generated className.
className: false,
```

## customClassName

-   `customClassName` (default `true`): This property adds a field to define a custom className for the block's wrapper.

```js
// Remove the support for the custom className.
customClassName: false,
```

## defaultStylePicker

-   `defaultStylePicker` (default `true`): When the style picker is shown, a dropdown is displayed so the user can select a default style for this block type. If you prefer not to show the dropdown, set this property to `false`.

```js
// Remove the Default Style picker.
defaultStylePicker: false,
```

## html

-   `html` (default `true`): By default, a block's markup can be edited individually. To disable this behavior, set `html` to `false`.

```js
// Remove support for an HTML mode.
html: false,
```

## inserter

-   `inserter` (default `true`): By default, all blocks will appear in the inserter. To hide a block so that it can only be inserted programmatically, set `inserter` to `false`.

```js
// Hide this block from the inserter.
inserter: false,
```

## multiple

-   `multiple` (default `true`): A non-multiple block can be inserted into each post, one time only. For example, the built-in 'More' block cannot be inserted again if it already exists in the post being edited. A non-multiple block's icon is automatically dimmed (unclickable) to prevent multiple instances.

```js
// Use the block just once per post
multiple: false,
```

## reusable

-   `reusable` (default `true`): A block may want to disable the ability of being converted into a reusable block.
    By default all blocks can be converted to a reusable block. If supports reusable is set to false, the option to convert the block into a reusable block will not appear.

```js
// Don't allow the block to be converted into a reusable block.
reusable: false,
```
