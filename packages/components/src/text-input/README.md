# TextInput

`TextInput` is a form component that users can enter content into.

## Table of contents

## Usage

```jsx live
import { __experimentalTextInput as TextInput } from '@wordpress/components';

function Example() {
	return <TextInput placeholder="First name" />;
}
```

## Props

##### \_\_\_debugger

**Type**: `Function`

For development only. Callback when a reducer action is dispatched.

##### align

**Type**: `CSS['alignItems']`

Aligns children using CSS Flexbox `align-items`. Vertically aligns content if the `direction` is `row`, or horizontally aligns content if the `direction` is `column`.

In the example below, `flex-start` will align the children content to the top.

##### arrow

**Type**: `boolean`,`"stepper"`

Renders specified incrementer/decrementer arrows.

##### defaultValue

**Type**: `boolean`

The default (initial) state to use if `value` is undefined.

##### direction

**Type**: `FlexDirection`

The direction flow of the children content can be adjusted with `direction`. `column` will align children vertically and `row` will align children horizontally.

##### disabled

**Type**: `boolean`

Determines if element is disabled.

##### error

**Type**: `boolean`

Renders an error state.

##### expanded

**Type**: `boolean`

Expands to the maximum available width (if horizontal) or height (if vertical).

##### format

**Type**: `"number"`,`"type"`

Modifies how `value` can be adjusted.

##### gap

**Type**: `number`

Spacing in between each child can be adjusted by using `gap`. The value of `gap` works as a multiplier to the library's grid system (base of `4px`).

##### isClickable

**Type**: `boolean`

Renders a `cursor: pointer` on hover.

##### isCommitOnBlurOrEnter

**Type**: `boolean`

Fires the `onChange` callback after pressing `ENTER` or focusing away.

##### isFocused

**Type**: `boolean`

Renders focus styles.

##### isInline

**Type**: `boolean`

Renders as an inline element (layout).

##### isResizable

**Type**: `boolean`

Allows for the a multiline `TextInput` to tbe resizable by dragging.

##### isRounded

**Type**: `boolean`

Renders with rounded corners.

##### isShiftStepEnabled

**Type**: `boolean`

Enables larger `step` increment/decrement values when holding down `Shift`.

##### isSubtle

**Type**: `boolean`

Renders a subtle `TextInput`.

##### justify

**Type**: `CSS['justifyContent']`

Horizontally aligns content if the `direction` is `row`, or vertically aligns content if the `direction` is `column`.
In the example below, `flex-start` will align the children content to the left.

##### label

**Type**: `string`

Label for the form element.

##### maxRows

**Type**: `number`

Maximum number of rows to show for a multiline `TextInput`.

##### minRows

**Type**: `number`

Alias for `rows`.

##### multiline

**Type**: `boolean`

Renders `TextInput` to allow for multiline lines (`textarea`).

##### onChange

**Type**: `Function`

Callback function when the `value` is committed.

##### onHeightChange

**Type**: `Function`

Callback function when the height changes with a multiline `TextInput`.

##### prefix

**Type**: `React.ReactElement`

Renders prefix content within `TextInput`.

##### size

**Type**: `"large"`,`"medium"`,`"small"`

Determines the size of `TextInput`.

##### suffix

**Type**: `React.ReactElement`

Renders prefix content within `TextInput`.

##### validate

**Type**: `Function`

Determines if the next `value` should be committed.

##### value

**Type**: `any`

Value for the form element.

##### wrap

**Type**: `boolean`

Determines if children should wrap.

<!-- /Automatically Generated -->
<!-- /props -->

## See Also

-   [Button](../button/)
-   [Select](../select/)
-   [UnitInput](../unitinput/)
