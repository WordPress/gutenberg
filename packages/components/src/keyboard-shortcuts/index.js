/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef, Children } from '@wordpress/element';
import { useKeyboardShortcut } from '@wordpress/compose';

function KeyboardShortcut( { target, callback, shortcut, bindGlobal, eventName } ) {
	useKeyboardShortcut( shortcut, callback, {
		bindGlobal,
		target,
		eventName,
	} );

	return null;
}

function KeyboardShortcuts( { children, shortcuts, bindGlobal, eventName } ) {
	const target = useRef();

	const element = map( shortcuts, ( callback, shortcut ) => (
		<KeyboardShortcut
			key={ shortcut }
			shortcut={ shortcut }
			callback={ callback }
			bindGlobal={ bindGlobal }
			eventName={ eventName }
			target={ target }
		/>
	) );

	// Render as non-visual if there are no children pressed. Keyboard
	// events will be bound to the document instead.
	if ( ! Children.count( children ) ) {
		return element;
	}

	return (
		<div ref={ target }>
			{ element }
			{ children }
		</div>
	);
}

export default KeyboardShortcuts;
