# Button
Buttons let users take actions and make choices with a single click or tap.

![Button components](https://make.wordpress.org/design/files/2019/03/button.png)

## Table of contents

1. [Design guidelines](#design-guidelines)
2. [Development guidelines](#development-guidelines)
3. [Related components](#related-components)

## Design guidelines

### Usage

Buttons tell users what actions they can take and give them a way to interact with the interface. You’ll find them throughout a UI, particularly in places like:

- Modals
- Forms
- Toolbars

### Best practices

Buttons should:

- **Be clearly and accurately labeled.**
- **Clearly communicate that clicking or tapping will trigger an action.**
- **Use established colors appropriately.** For example, only use red buttons for actions that are difficult or impossible to undo.
- **Prioritize the most important actions.** This helps users focus. Too many calls to action on one screen can be confusing, making users unsure what to do next.
- **Have consistent locations in the interface.**

### Content guidelines

Buttons should be clear and predictable—users should be able to anticipate what will happen when they click a button. Never deceive a user by mislabeling a button.

Buttons text should lead with a strong verb that encourages action, and add a noun that clarifies what will actually change. The only exceptions are common actions like Save, Close, Cancel, or OK. Otherwise, use the {verb}+{noun} format to ensure that your button gives the user enough information.

Button text should also be quickly scannable — avoid unnecessary words and articles like the, an, or a.

### Types

#### Link button

Link buttons have low emphasis. They don’t stand out much on the page, so they’re used for less-important actions. What’s less important can vary based on context, but it’s usually a supplementary action to the main action we want someone to take. Link buttons are also useful when you don’t want to distract from the content.

![Link button](https://make.wordpress.org/design/files/2019/03/link-button.png)

#### Default button

Default buttons have medium emphasis. The button appearance helps differentiate them from the page background, so they’re useful when you want more emphasis than a link button offers.

![Default button](https://make.wordpress.org/design/files/2019/03/default-button.png)

#### Primary button

Primary buttons have high emphasis. Their color fill and shadow means they pop off the background.

Since a high-emphasis button commands the most attention, a layout should contain a single primary button. This makes it clear that other buttons have less importance and helps users understand when an action requires their attention.

![Primary button](https://make.wordpress.org/design/files/2019/03/primary-button.png)

#### Text label

All button types use text labels to describe the action that happens when a user taps a button. If there’s no text label, there should be an icon to signify what the button does (e.g. an IconButton component).

![](https://make.wordpress.org/design/files/2019/03/do-link-button.png)

**Do**
Use color to distinguish link button labels from other text.

![](https://make.wordpress.org/design/files/2019/03/dont-wrap-button-text.png)

**Don’t**
Don’t wrap button text. For maximum legibility, keep text labels on a single line.

### Hierarchy

![A layout with a single prominent button](https://make.wordpress.org/design/files/2019/03/button.png)

A layout should contain a single prominently-located button. If multiple buttons are required, a single high-emphasis button can be joined by medium- and low-emphasis buttons mapped to less-important actions. When using multiple buttons, make sure the available state of one button doesn’t look like the disabled state of another.

![A diagram showing high emphasis at the top, medium emphasis in the middle, and low emphasis at the bottom](https://make.wordpress.org/design/files/2019/03/button-hierarchy.png)

A button’s level of emphasis helps determine its appearance, typography, and placement.

#### Placement

Use button types to express different emphasis levels for all the actions a user can perform.

![A link, default, and primary button](https://make.wordpress.org/design/files/2019/03/button-layout.png)

This screen layout uses:

1. A primary button for high emphasis.
2. A default button for medium emphasis.
3. A link button for low emphasis.

Placement best practices:

- **Do**: When using multiple buttons in a row, show users which action is more important by placing it next to a button with a lower emphasis (e.g. a primary button next to a default button, or a default button next to a link button).
- **Don’t**: Don’t place two primary buttons next to one another — they compete for focus. Only use one primary button per view.
- **Don’t**: Don’t place a button below another button if there is space to place them side by side.
- **Caution**: Avoid using too many buttons on a single page. When designing pages in the app or website, think about the most important actions for users to take. Too many calls to action can cause confusion and make users unsure what to do next — we always want users to feel confident and capable.

## Development guidelines

### Usage

Renders a button with default style.

```jsx
import { Button } from "@wordpress/components";

const MyButton = () => (
	<Button isDefault>
		Click me!
	</Button>
);
```

### Props

The presence of a `href` prop determines whether an `anchor` element is rendered instead of a `button`.

Props not included in this set will be applied to the `a` or `button` element.

Name | Type | Default | Description
--- | --- | --- | ---
`disabled` | `bool` | `false` | Whether the button is disabled. If `true`, this will force a `button` element to be rendered.
`href` | `string` | `undefined` | If provided, renders `a` instead of `button`.
`isDefault` | `bool` | `false` | Renders a default button style.
`isPrimary` | `bool` | `false` | Renders a primary button style.
`isTertiary` | `bool` | `false` | Renders a text-based button style.
`isDestructive` | `bool` | `false` | Renders a red text-based button style to indicate destructive behavior.
`isLarge` | `bool` | `false` | Increases the size of the button.
`isSmall` | `bool` | `false` | Decreases the size of the button.
`isToggled` | `bool` | `false` | Renders a toggled button style.
`isBusy` | `bool` | `false` | Indicates activity while a action is being performed.
`isLink` | `bool` | `false` | Renders a button with an anchor style.
`focus` | `bool` | `false` | Whether the button is focused.

## Related components

- To group buttons together, use the `ButtonGroup` component.
- To display an icon inside the button, use the `IconButton` component.
