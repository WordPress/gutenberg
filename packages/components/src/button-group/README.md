# ButtonGroup

ButtonGroup can be used to group any related buttons together. To emphasize related buttons, a group should share a common container.

![ButtonGroup component](https://wordpress.org/gutenberg/files/2018/12/s_96EC471FE9C9D91A996770229947AAB54A03351BDE98F444FD3C1BF0CED365EA_1541792995815_ButtonGroup.png)

## Design guidelines

### Usage

#### Selected action

![ButtonGroup selection](https://wordpress.org/gutenberg/files/2018/12/s_96EC471FE9C9D91A996770229947AAB54A03351BDE98F444FD3C1BF0CED365EA_1544127594329_ButtonGroup-Do.png)

**Do**
Only one option in a button group can be selected and active at a time. Selecting one option deselects any other.

### Best practices

Button groups should:

-   **Be clearly and accurately labeled.**
-   **Clearly communicate that clicking or tapping will trigger an action.**
-   **Use established colors appropriately.** For example, only use red buttons for actions that are difficult or impossible to undo.
-   **Have consistent locations in the interface.**

### States

![ButtonGroup component](https://wordpress.org/gutenberg/files/2018/12/s_96EC471FE9C9D91A996770229947AAB54A03351BDE98F444FD3C1BF0CED365EA_1541792995815_ButtonGroup.png)

**Active and available button groups**

A button group’s state makes it clear which button is active. Hover and focus states express the available selection options for buttons in a button group.

**Disabled button groups**

Button groups that cannot be selected can either be given a disabled state, or be hidden.

## Development guidelines

### Usage

```jsx
import { Button, ButtonGroup } from '@wordpress/components';

const MyButtonGroup = () => (
	<ButtonGroup>
		<Button variant="primary">Button 1</Button>
		<Button variant="primary">Button 2</Button>
	</ButtonGroup>
);
```

## Related components

-   For individual buttons, use a `Button` component.
