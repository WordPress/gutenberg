# Button

Buttons express what action will occur when the user clicks or taps it. Buttons are used to trigger an action, and they can be used for any type of action, including navigation.

The presence of a `href` prop determines whether an `anchor` element is rendered instead of a `button`.

Note that this component may sometimes be confused with the Button block, which has semantically different use cases and functionality.

## Usage

Renders a button with default style.

```jsx
import { Button } from "@wordpress/components";

const MyButton = () => (
	<Button isDefault>
		Click me!
	</Button>
);
```

## Props

Name | Type | Default | Description
--- | --- | --- | ---
`href` | `string` | `undefined` | If provided, renders `a` instead of `button`.
`isDefault` | `bool` | `false` | Renders a default button style.
`isPrimary` | `bool` | `false` | Renders a primary button style.
`isLarge` | `bool` | `false` | Increases the size of the button.
`isSmall` | `bool` | `false` | Decreases the size of the button.
`isToggled` | `bool` | `false` | Renders a toggled button style.
`isBusy` | `bool` | `false` | Indicates activity while a action is being performed.
`isLink` | `bool` | `false` | Renders a button with an anchor style.
`focus` | `bool` | `false` | Whether the button is focused.

## Related components

* To group buttons together, use the `ButtonGroup` component.
* To display an icon inside the button, use the `IconButton` component.
