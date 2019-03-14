# Dialog

The dialog is used to create an accessible dialog over an application.

**Note:** The API for this dialog has been mimicked to resemble [`react-dialog`](https://github.com/reactjs/react-dialog).

## Usage

The following example shows you how to properly implement a dialog. For the dialog to properly work it's important you implement the close logic for the dialog properly.

```jsx
import { Button, Dialog } from '@wordpress/components';
import { withState } from '@wordpress/compose';

const MyDialog = withState( {
	isOpen: false,
} )( ( { isOpen, setState } ) => (
	<div>
		<Button isDefault onClick={ () => setState( { isOpen: true } ) }>Open Dialog</Button>
		{ isOpen && (
			<Dialog
				title="This is my dialog"
				onRequestClose={ () => setState( { isOpen: false } ) }>
				<Button isDefault onClick={ () => setState( { isOpen: false } ) }>
					My custom close button
				</Button>
			</Dialog>
		) }
	</div>
) );
```

## Props

The set of props accepted by the component will be specified below.
Props not included in this set will be applied to the input elements.

### title

This property is used as the dialog header's title. It is required for accessibility reasons.

- Type: `String`
- Required: Yes

### onRequestClose

This function is called to indicate that the dialog should be closed.

- Type: `function`
- Required: Yes

### contentLabel

If this property is added, it will be added to the dialog content `div` as `aria-label`.
You are encouraged to use this if `aria.labelledby` is not provided.

- Type: `String`
- Required: No

### aria.labelledby

If this property is added, it will be added to the dialog content `div` as `aria-labelledby`.
You are encouraged to use this when the dialog is visually labelled.

- Type: `String`
- Required: No
- Default: `dialog-heading`

### aria.describedby

If this property is added, it will be added to the dialog content `div` as `aria-describedby`.

- Type: `String`
- Required: No

### focusOnMount

If this property is true, it will focus the first tabbable element rendered in the dialog.

- Type: `boolean`
- Required: No
- Default: true

### shouldCloseOnEsc

If this property is added, it will determine whether the dialog requests to close when the escape key is pressed.

- Type: `boolean`
- Required: No
- Default: true

### shouldCloseOnClickOutside

If this property is added, it will determine whether the dialog requests to close when a mouse click occurs outside of the dialog content.

- Type: `boolean`
- Required: No
- Default: true

### isDismissable

If this property is set to false, the dialog will not display a close icon and cannot be dismissed.

- Type: `boolean`
- Required: No
- Default: true

### className

If this property is added, it will an additional class name to the dialog content `div`.

- Type: `String`
- Required: No

### role

If this property is added, it will override the default role of the dialog.

- Type: `String`
- Required: No
- Default: `dialog`

### overlayClassName

If this property is added, it will an additional class name to the dialog overlay `div`.

- Type: `String`
- Required: No
