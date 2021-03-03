# Button

`Button` is a component used to trigger an action or event, such as submitting a Form, opening a Dialog, canceling an action, or performing a delete operation.

## Usage

```jsx
import { Button } from '@wordpress/components/ui';

function Example() {
	return <Button variant="secondary">Code is Poetry</Button>;
}
```

## Props

##### disabled

**Type**: `boolean`

Renders `Button` in a disabled state.

##### elevation

**Type**: `number`

Renders `Elevation` styles for the `Button`.

##### elevationActive

**Type**: `number`

Renders `Elevation` styles for the `Button` when active.

##### elevationFocus

**Type**: `number`

Renders `Elevation` styles for the `Button` when focused.

##### elevationHover

**Type**: `number`

Renders `Elevation` styles for the `Button` when hovered.

##### gap

**Type**: `number`

The amount of space between each child element within `Button`.

##### hasCaret

**Type**: `boolean`

Determines if a caret `Icon` should render within the `Button`

##### href

**Type**: `string`

An HTML anchor link. Transforms the `Button` in a `<a>` element.

##### icon

**Type**: `React.ReactElement`

Renders an `Icon` within the `Button`.

##### iconSize

**Type**: `number`

Adjusts the size of the `Icon` within the `Button` (from the `icon` prop).

##### isBlock

**Type**: `boolean`

Determines if `Button` should render as a block element, rather than inline.

##### isControl

**Type**: `boolean`

Renders `Button` with control styles, similar to `TextInput` or `Select`.

##### isDestructive

**Type**: `boolean`

Renders destructive variant.

##### isLoading

**Type**: `boolean`

Renders loading, disabling `Button` and renders a `Spinner`.

##### isNarrow

**Type**: `boolean`

Renders a narrower `Button`.

##### isRounded

**Type**: `boolean`

Renders a rounded `Button`.

##### isSubtle

**Type**: `boolean`

Renders a subtle `Button`.

##### justify

**Type**: `CSS['justifyContent']`

Determines how inner content is aligned.

##### noWrap

**Type**: `boolean`

Determines if inner content should be wrapped.

##### pre

**Type**: `React.ReactElement`

Renders prefix content within `Button`.

##### size

**Type**: `"xLarge"`,`"large"`,`"medium"`,`"small"`,`"xSmall"`

Determines the size of `Button`.

##### suffix

**Type**: `React.ReactElement`

Renders suffix content within `Button`.

##### textAlign

**Type**: `CSS['textAlign']`

Modifies the text-align (CSS) styles of `Button` content.

##### variant

**Type**: `"primary"`,`"secondary"`,`"tertiary"`,`"plain"`,`"link"`

Determines the `Button` variant to render.
