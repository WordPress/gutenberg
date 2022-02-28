# `ConfirmDialog`

<div class="callout callout-alert">
This feature is still experimental. "Experimental" means this is an early implementation subject to drastic and breaking changes.
</div>

`ConfirmDialog` is built of top of [`Modal`](/packages/components/src/modal/README.md] and displays a confirmation dialog, with _confirm_ and _cancel_ buttons.

The dialog is confirmed by clicking the _confirm_ button or by pressing the `Enter` key. It is cancelled (closed) by clicking the _cancel_ button, by pressing the `ESC` key, or by clicking outside the dialog focus (i.e, the overlay).

## Usage

`ConfirmDialog` has two main implicit modes: controlled and uncontrolled.

### Uncontrolled mode

Allows the component to be used standalone, just by declaring it as part of another React's component render method:

-   It will be automatically open (displayed) upon mounting;
-   It will be automatically closed when when clicking the _cancel_ button, by pressing the `ESC` key, or by clicking outside the dialog focus (i.e, the overlay);
-   `onCancel` is not mandatory but can be passed. Even if passed, the dialog will still be able to close itself.

Activating this mode is as simple as omitting the `isOpen` prop. The only mandatory prop, in this case, is the `onConfirm` callback. The message is passed as the `children`. You can pass any JSX you'd like, which allows to further format the message or include sub-component if you'd like:

```jsx
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';

function Example() {
	return (
		<ConfirmDialog onConfirm={ () => console.debug( ' Confirmed! ' ) }>
			Are you sure? <strong>This action cannot be undone!</strong>
		</ConfirmDialog>
	);
}
```

### Controlled mode

Let the parent component control when the dialog is open/closed. It's activated when a boolean value is passed to `isOpen`:

-   It will not be automatically closed. You need to let it know when to open/close by updating the value of the `isOpen` prop;
-   Both `onConfirm` and the `onCancel` callbacks are mandatory props in this mode;
-   You'll want to update the state that controls `isOpen` by updating it from the `onCancel` and `onConfirm` callbacks.

```jsx
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';

function Example() {
	const [ isOpen, setIsOpen ] = useState( true );

	const handleConfirm = () => {
		console.debug( 'Confirmed!' );
		setIsOpen( false );
	};

	const handleCancel = () => {
		console.debug( 'Cancelled!' );
		setIsOpen( false );
	};

	return (
		<ConfirmDialog
			isOpen={ isOpen }
			onConfirm={ handleConfirm }
			onCancel={ handleCancel }
		>
			Are you sure? <strong>This action cannot be undone!</strong>
		</ConfirmDialog>
	);
}
```

### Unsupported: Multiple instances

Multiple `ConfirmDialog's is an edge case that's currently not officially supported by this component. At the moment, new instances will end up closing the last instance due to the way the `Modal` is implemented.

## Custom Types

```ts
type DialogInputEvent =
	| KeyboardEvent< HTMLDivElement >
	| MouseEvent< HTMLButtonElement >;
```

## Props

### `title`: `string`

-   Required: No

An optional `title` for the dialog. Setting a title will render it in a title bar at the top of the dialog, making it a bit taller. The bar will also include an `x` close button at the top-right corner.

### `children`: `React.ReactNode`

-   Required: Yes

The actual message for the dialog. It's passed as children and any valid `ReactNode` is accepted:

```jsx
<ConfirmDialog>
	Are you sure? <strong>This action cannot be undone!</strong>
</ConfirmDialog>
```

### `isOpen`: `boolean`

-   Required: No

Defines if the dialog is open (displayed) or closed (not rendered/displayed). It also implicitly toggles the controlled mode if set or the uncontrolled mode if it's not set.

### `onConfirm`: `( event: DialogInputEvent ) => void`

-   Required: Yes

The callback that's called when the user confirms. A confirmation can happen when the `OK` button is clicked or when `Enter` is pressed.

### `onCancel`: `( event: DialogInputEvent ) => void`

-   Required: Only if `isOpen` is not set

The callback that's called when the user cancels. A cancellation can happen when the `Cancel` button is clicked, when the `ESC` key is pressed, or when a click outside of the dialog focus is detected (i.e. in the overlay).

It's not required if `isOpen` is not set (uncontrolled mode), as the component will take care of closing itself, but you can still pass a callback if something must be done upon cancelling (the component will still close itself in this case).

If `isOpen` is set (controlled mode), then it's required, and you need to set the state that defines `isOpen` to `false` as part of this callback if you want the dialog to close when the user cancels.

### `confirmButtonText`: `string`

-   Required: No
-   Default: OK

The optional custom text to display as the confirmation button's label

### `cancelButtonText`: `string`

-   Required: No
-   Default: Cancel

The optional custom text to display as the cancelation button's label
