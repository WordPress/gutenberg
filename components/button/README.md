# Button

Buttons express what action will occur when the user clicks or taps it. Buttons are used to trigger an action, and they can be used for any type of action, including navigation.

The presence of a `href` prop determines whether an `anchor` element is rendered instead of a `button`.

## Usage

```jsx
import { Button } from "@wordpress/components";

export default function ClickMeButton() {
	return (
		<Button isDefault>
			Click me!
		</Button>
	);
}
```

## Props

Name | Type | Default | Description
--- | --- | --- | ---
`href` | `string` | `undefined` | If provided, renders `a` instead of `button`.
`target` | `string` | `undefined` | Context in which the `href` resource will open.
`isDefault` | `bool` | `false` | Renders a default button style.
`isPrimary` | `bool` | `false` | Renders a primary button style.
`isLarge` | `bool` | `false` | Increases the size of the button
`isSmall` | `bool` | `false` | Decreases the size of the button
`isToggled` | `bool` | `false` | Renders a toggled button style.
`isBusy` | `bool` | `false` | Indicates activity while a action is being performed.
`isLink` | `bool` | `false` | Renders a button with an anchor style.
`className` | `string` | | Additional classes.
`disabled` | `bool` | `false` | Disables the Button.
`focus` | `bool` | `false` | Whether the button is focused.

## General guidelines

* Use clear and accurate labels. Use sentence-style capitalization.
* Lead with strong, concise, and actionable verbs.
* When the customer is confirming an action, use specific labels, such as **Save** or **Trash**, instead of using **OK** and **Cancel**.
* Prioritize the most important actions. Too many calls to action can cause confusion and make customers unsure of what to do next.

## Related components

* To group buttons together, use the `button-group` component.
* To display an icon inside the button, use the `icon-button` component.