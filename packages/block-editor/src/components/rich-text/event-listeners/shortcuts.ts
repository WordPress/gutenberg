import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';
import { unlock } from '../../../lock-unlock';
import type { RichTextEventListener } from '../types';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

const shortcuts: RichTextEventListener = ( props ) => ( element ) => {
	const { keyboardShortcuts } = props.current;
	function onKeyDown( event: KeyboardEvent ) {
		for ( const keyboardShortcut of keyboardShortcuts ) {
			keyboardShortcut( event );
		}
	}

	return subscribeOwnedListener( element, 'keydown', onKeyDown, true );
};

export default shortcuts;
