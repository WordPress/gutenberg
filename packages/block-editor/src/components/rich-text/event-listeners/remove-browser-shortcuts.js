/**
 * WordPress dependencies
 */
import { isKeyboardEvent } from '@wordpress/keycodes';
import { privateApis as composePrivateApis } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

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
	return subscribeDelegatedListener( node, 'keydown', onKeydown, true );
};
