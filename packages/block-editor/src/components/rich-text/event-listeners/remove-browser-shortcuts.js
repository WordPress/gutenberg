/**
 * WordPress dependencies
 */
import { isKeyboardEvent } from '@wordpress/keycodes';

import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

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
	return subscribeOwnedListener( node, 'keydown', onKeydown, true );
};
