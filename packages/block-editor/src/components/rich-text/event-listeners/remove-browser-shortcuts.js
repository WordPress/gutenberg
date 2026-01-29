/**
 * WordPress dependencies
 */
import { isKeyboardEvent } from '@wordpress/keycodes';

/**
 * Hook to prevent default behaviors for key combinations otherwise handled
 * internally by RichText.
 */
export default () => ( node ) => {
	function onKeydown( event ) {
		if (
			isKeyboardEvent.primary( event, 'z' ) ||
			isKeyboardEvent.primary( event, 'y' ) ||
			isKeyboardEvent.primaryShift( event, 'z' )
		) {
			event.preventDefault();
		}
	}
	node.addEventListener( 'keydown', onKeydown );
	return () => {
		node.removeEventListener( 'keydown', onKeydown );
	};
};
