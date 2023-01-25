/**
 * WordPress dependencies
 */
import { useRef, Children } from '@wordpress/element';
import { useKeyboardShortcut } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type { KeyboardShortcutProps, KeyboardShortcutsProps } from './types';

function KeyboardShortcut( {
	target,
	callback,
	shortcut,
	bindGlobal,
	eventName,
}: KeyboardShortcutProps ) {
	useKeyboardShortcut( shortcut, callback, {
		bindGlobal,
		target,
		eventName,
	} );

	return null;
}

function KeyboardShortcuts( {
	children,
	shortcuts,
	bindGlobal,
	eventName,
}: KeyboardShortcutsProps ) {
	const target = useRef( null );

	const element = Object.entries( shortcuts ?? {} ).map(
		( [ shortcut, callback ] ) => (
			<KeyboardShortcut
				key={ shortcut }
				shortcut={ shortcut }
				callback={ callback }
				bindGlobal={ bindGlobal }
				eventName={ eventName }
				target={ target }
			/>
		)
	);

	// Render as non-visual if there are no children pressed. Keyboard
	// events will be bound to the document instead.
	if ( ! Children.count( children ) ) {
		return <>{ element }</>;
	}

	return (
		<div ref={ target }>
			{ element }
			{ children }
		</div>
	);
}

export default KeyboardShortcuts;
