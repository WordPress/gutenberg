# Modal

Modals give users information and choices related to a task they’re trying to accomplish. They can contain critical information, require decisions, or involve multiple tasks.

![An alert modal for trashing a post](https://wordpress.org/gutenberg/files/2019/04/Modal.png)

## Table of contents

1. [Design guidelines](#design-guidelines)
2. [Development guidelines](#development-guidelines)
3. [Related components](#related-components)

## Design guidelines

### Usage

A modal is a type of floating window that appears in front of content to provide critical information or ask for a decision. Modals disable all other functionality when they appear. A modal remains on screen until the user confirms it, dismisses it, or takes the required action.

While modals can be an effective way to disclose additional controls or information, they can also be a source of interruption for the user. For this reason, always question whether a modal is necessary, and work to avoid the situations in which they are required.

#### Principles

- **Focused**. Modals pull user attention away from the rest of the screen to focus their attention, ensuring that the modal’s content is addressed.
- **Direct**. Modal text should communicate important information and be dedicated to helping the user appropriately complete a task.
- **Helpful**. Modals should appear in response to a user task or an action to offer relevant and contextual information.

#### When to use

Modals are used for:

- Errors that block normal operation.
- Critical information that requires a specific user task, decision, or acknowledgement.
- Contextual information that appears in response to a user task or action.

### Anatomy

![A modal diagram with labels](https://wordpress.org/gutenberg/files/2019/04/Modal-diagram.png)

1. Container
2. Title (optional)
3. Supporting text
4. Buttons
5. Scrim
6. Close button (optional)

### Modal box and scrim

A modal is a type of window. Access to the rest of the UI is disabled until the modal is addressed. All modals are interruptive by design – their purpose is to have the user focus on content, so the modal surface appears in front of all other surfaces.

To clarify that the rest of the screen is inaccessible and to focus attention on the modal, surfaces behind the modal are scrimmed — they get a temporary overlay to obscure their content and make it less prominent.

### Title

A modal’s purpose is communicated through its title and button text.

Titles should:

- Contain a brief, clear statement or question
- Avoid apologies (“Sorry for the interruption”), alarm (“Warning!”), or ambiguity (“Are you sure?”).

![A modal that asks "Trash post?"](https://wordpress.org/gutenberg/files/2019/04/Modal-do-1.png)

**Do**
This modal title poses a specific question, concisely explains the purpose the request, and provides clear actions.

![A modal that asks "Are you sure?"](https://wordpress.org/gutenberg/files/2019/04/Modal-dont-1.png)

**Don’t**
This modal creates ambiguity, and therefore unease — it leaves the user unsure about how to respond, or causes them to second-guess their answer.

### Buttons

#### Side-by-side buttons (recommended)

Side-by-side buttons display two text buttons next to one another.

![A modal with two buttons next to each other](https://wordpress.org/gutenberg/files/2019/04/Modal-buttons.png)

#### Stacked or full-width buttons

Use stacked buttons when you need to accommodate longer button text. Always place confirming actions above dismissive actions.

![A modal with two buttons stacked on top of each other](https://wordpress.org/gutenberg/files/2019/04/Modal-buttons-stacked.png)

### Behavior

Modals appear without warning, requiring users to stop their current task. They should be used sparingly — not every choice or setting warrants this kind of abrupt interruption.

#### Position

Modals retain focus until dismissed or the user completes an action, like choosing a setting. They shouldn’t be obscured by other elements or appear partially on screen.

#### Scrolling

Most modal content should avoid scrolling. Scrolling is permissible if the modal content exceeds the height of the modal (e.g. a list component with many rows). When a modal scrolls, the modal title is pinned at the top and the buttons are pinned at the bottom. This ensures that content remains visible alongside the title and buttons, even while scrolling.

Modals don’t scroll with elements outside of the modal, like the background.

When viewing a scrollable list of options, the modal title and buttons remain fixed.

#### Dismissing modals

Modals are dismissible in three ways:

- Tapping outside of the modal
- Tapping the “Cancel” button
- Tapping the “Close” icon button, or pressing the `esc` key

If the user’s ability to dismiss a modal is disabled, they must choose a modal action to proceed.

## Development guidelines

The modal is used to create an accessible modal over an application.

**Note:** The API for this modal has been mimicked to resemble [`react-modal`](https://github.com/reactjs/react-modal).

### Usage

The following example shows you how to properly implement a modal. For the modal to properly work it's important you implement the close logic for the modal properly.

```jsx
import { Button, Modal } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyModal = () => {
	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );

	return (
		<>
			<Button isSecondary onClick={ openModal }>Open Modal</Button>
			{ isOpen && (
				<Modal
					title="This is my modal"
					onRequestClose={ closeModal }>
					<Button isSecondary onClick={ closeModal }>
						My custom close button
					</Button>
				</Modal>
			) }
		</>
	)
}
```

### Props

The set of props accepted by the component will be specified below.
Props not included in this set will be applied to the input elements.

#### title

This property is used as the modal header's title. It is required for accessibility reasons.

- Type: `String`
- Required: Yes

#### onRequestClose

This function is called to indicate that the modal should be closed.

- Type: `function`
- Required: Yes

#### contentLabel

If this property is added, it will be added to the modal content `div` as `aria-label`.
You are encouraged to use this if `aria.labelledby` is not provided.

- Type: `String`
- Required: No

#### aria.labelledby

If this property is added, it will be added to the modal content `div` as `aria-labelledby`.
You are encouraged to use this when the modal is visually labelled.

- Type: `String`
- Required: No
- Default: `modal-heading`

#### aria.describedby

If this property is added, it will be added to the modal content `div` as `aria-describedby`.

- Type: `String`
- Required: No

#### focusOnMount

If this property is true, it will focus the first tabbable element rendered in the modal.

- Type: `boolean`
- Required: No
- Default: true

#### shouldCloseOnEsc

If this property is added, it will determine whether the modal requests to close when the escape key is pressed.

- Type: `boolean`
- Required: No
- Default: true

#### shouldCloseOnClickOutside

If this property is added, it will determine whether the modal requests to close when a mouse click occurs outside of the modal content.

- Type: `boolean`
- Required: No
- Default: true

#### isDismissible

If this property is set to false, the modal will not display a close icon and cannot be dismissed.

- Type: `boolean`
- Required: No
- Default: true

#### className

If this property is added, it will an additional class name to the modal content `div`.

- Type: `String`
- Required: No

#### role

If this property is added, it will override the default role of the modal.

- Type: `String`
- Required: No
- Default: `dialog`

#### overlayClassName

If this property is added, it will an additional class name to the modal overlay `div`.

- Type: `String`
- Required: No


## Related components

- To notify a user with a message of medium importance, use `Notice`.
