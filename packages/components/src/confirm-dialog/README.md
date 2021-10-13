# `ConfirmDialog`

<div class="callout callout-alert">
This feature is still experimental. "Experimental" means this is an early implementation subject to drastic and breaking changes.
</div>

`ConfirmDialog` displays a confirmation dialog as a `Modal`, with `OK` and `Cancel` buttons. It's confirmed by clicking `OK` or by pressing the `Enter` key. It's cancelled by clicking `Cancel` or by pressing the `ESC` key or clicking outside the dialog focus (i.e, the overlay).

It's built on top of `Modal`, so you can override any of the `Modal` props if you'd like. This also means that it's added as a child of the `body` element in the DOM tree through a React `Portal`, regardless of where it's declared in the React tree.

## Usage

`ConfirmDialog` has two main implicit modes: controlled and uncontrolled.

### Uncontrolled mode

Allows the component to be used standalone, just by declaring it as part of another React's component render method:
  * It will be automatically open (displayed) upon mounting;
  * It will automatically close itself when the `x`, `Cancel`, `Confirm` or overlay is clicked;
  * `onCancel` is not mandatory but can be passed. Even if passed, the dialog will still be able to close itself.

Activating this mode is as simple as omitting the `isOpen` prop. The only mandatory prop, in this case, is the `onConfirm` callback.

```jsx
import {
  __experimentalConfirmDialog as ConfirmDialog
} from '@wordpress/components';

function Example() {
  return (
    <ConfirmDialog onConfirm={ () => console.debug(' Confirmed! ') } />
  );
}
```

### Controlled mode

Let the parent component control when the dialog is open/closed. It's activated when a boolean value is passed to `isOpen`:
  * It will not be automatically closed. You need to let it know when to open/close by updating the value of the `isOpen` prop;
  * Both `onConfirm` and the `onCancel` callbacks are mandatory props in this mode;
  * You'll want to update the state that controls `isOpen` by updating it from the `onCancel` and `onConfirm` callbacks.


```jsx
import {
  __experimentalConfirmDialog as ConfirmDialog
} from '@wordpress/components';

function Example() {
  const [ isOpen, setIsOpen ] = useState( true );

  const handleConfirm = () => {
    console.debug( 'Confirmed!' );
    setIsOpen( false );
  }

  const handleCancel = () => {
    console.debug( 'Cancelled!' );
    setIsOpen( false );
  }

  return (
    <ConfirmDialog isOpen={ isOpen } onConfirm={ handleConfirm } onCancel={ handleCancel }>
  )
}
```

### Unsupported: Multiple instances

Multiple `ConfirmDialog's is an edge case that's currently not officially supported by this component. At the moment, new instances will end up closing the last instance due to the way the `Modal` is implemented (more specifically, because of the use of the `onFocusOutside` to detect a blur in order to close it). This will end up automatically cancelling the previous instance, which might or might not be what you want.

Suppose you need to handle multiple confirmations without discarding other instances. In that case, it might be better to have a singleton wrapper component that provides a context-based API to trigger the dialog, keeping track of multiple instances. Here's an [example](https://github.com/WordPress/gutenberg/pull/34153#issuecomment-908342367).

## Custom Types

```ts
type DialogInputEvent =
	| KeyboardEvent< HTMLDivElement >
	| MouseEvent< HTMLButtonElement >
```

## Props

### `isOpen`: `boolean`

Defines if the dialog is open (displayed) or closed (not rendered/displayed). It also implicitly toggles the controlled mode if set or the uncontrolled mode if it's not set.

### `onConfirm`: `( event: DialogInputEvent ) => void`

- Required: Yes

The callback that's called when the user confirms. A confirmation can happen when the `OK` button is clicked or when `Enter` is pressed.

### `onCancel`: `(event: DialogInputEvent ) => void`

- Required: Yes if `isOpen` is set, No if `isOpen` is not set

The callback that's called when the user cancels. A cancellation can happen when the `Cancel` button is clicked, when the `ESC` key is pressed, or when a click outside of the dialog focus is detected (i.e. in the overlay).

It's not required if `isOpen` is not set (uncontrolled mode), as the component will take care of closing itself, but you can still pass a callback if something must be done upon cancelling (the component will still close itself in this case).

If `isOpen` is set (controlled mode), then it's required, and you need to set the state that defines `isOpen` to `false` as part of this callback if you want the dialog to close when the user cancels.
