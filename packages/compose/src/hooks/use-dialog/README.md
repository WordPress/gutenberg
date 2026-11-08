# `useDialog`

React hook to be used on a dialog wrapper to enable the following behaviors:

-   constrained tabbing.
-   focus on mount.
-   return focus on unmount.
-   focus outside.
-   close on Escape.

## Usage

```jsx
import { __experimentalUseDialog as useDialog } from '@wordpress/compose';

const MyDialog = () => {
	const [ ref, dialogProps ] = useDialog( {
		onClose: () => console.log( 'do something to close the dialog' ),
	} );

	return (
		<div ref={ ref } { ...dialogProps }>
			<Button />
			<Button />
		</div>
	);
};
```

## Options

### `focusOnMount`

-   Type: `'firstElement' | 'firstInputElement' | boolean`
-   Default: `'firstElement'`

Determines focus behavior when the dialog mounts:

-   `'firstElement'` focuses the first tabbable element within the dialog.
-   `'firstInputElement'` focuses the first value control within the dialog.
-   `true` focuses the dialog wrapper itself.
-   `false` does nothing, and _should not be used unless an accessible substitute behavior is implemented_.

### `constrainTabbing`

-   Type: `boolean`
-   Default: `focusOnMount !== false`

Whether tabbing is constrained within the dialog (preventing keyboard focus from leaving without explicit focus elsewhere), or whether the dialog remains part of the wider tab order.

### `onClose`

-   Type: `() => void`

Called when the dialog should close, e.g. when the user presses Escape or focus moves outside.

### `onKeyDown`

-   Type: `KeyboardEventHandler<HTMLElement>`

Optional `onKeyDown` handler, merged with the built-in close-on-Escape handler. Provided to keep things working when the dialog wrapper already has its own `onKeyDown`. The provided handler runs first and can call `event.preventDefault()` to opt out of close-on-Escape.

## Returned value

A tuple of:

### `ref`

-   Type: `RefCallback<HTMLElement>`

A React ref to attach to the dialog wrapper DOM element.

### `dialogProps`

-   Type: `object`

Extra props (`onFocus`, `onBlur`, `onKeyDown`, `tabIndex`, …) to spread onto the same wrapper element.
