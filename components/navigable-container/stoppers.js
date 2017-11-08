/**
 * WordPress Dependencies
 */
import { keycodes } from '@wordpress/utils';

/**
 * Module Constants
 */
const { UP, DOWN, LEFT, RIGHT, TAB } = keycodes;

function stopBubbling( event ) {
	// Prevents arrow key handlers bound to the document directly interfering
	event.nativeEvent.stopImmediatePropagation();
	event.stopPropagation();
}

function handleHorizontalArrows( event ) {
	// Do not preventDefault if inside a textarea or input where the arrow keys should move inside it.
	if ( ! [ 'textarea', 'input' ].indexOf( event.target.nodeName.toLowerCase() ) ) {
		event.preventDefault();
	}

	stopBubbling( event );
}

function stopEvent( event ) {
	event.preventDefault();
	stopBubbling( event );
}

export function stopEventIfRequired( stopArrowEvents, stopTabEvents, event ) {
	const { keyCode } = event;

	if ( stopArrowEvents && [ LEFT, RIGHT ].indexOf( keyCode ) > -1 ) {
		handleHorizontalArrows( event );
	} else if ( stopArrowEvents && [ UP, DOWN ].indexOf( keyCode ) > -1 ) {
		stopEvent( event );
	} else if ( stopTabEvents && TAB === keyCode ) {
		stopEvent( event );
	}
}
