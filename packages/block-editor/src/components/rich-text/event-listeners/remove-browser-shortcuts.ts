import { isKeyboardEvent } from '@wordpress/keycodes';
import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';
import { unlock } from '../../../lock-unlock';
import type { RichTextEventListener } from '../types';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

/**
 * Hook to prevent default behaviors for key combinations otherwise handled
 * internally by RichText.
 */
const removeBrowserShortcuts: RichTextEventListener = () => ( node ) => {
	function onKeydown( event: KeyboardEvent ) {
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

export default removeBrowserShortcuts;
