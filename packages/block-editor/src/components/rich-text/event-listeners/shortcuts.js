/**
 * WordPress dependencies
 */

import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

export default ( props ) => ( element ) => {
	const { keyboardShortcuts } = props.current;
	function onKeyDown( event ) {
		for ( const keyboardShortcut of keyboardShortcuts.current ) {
			keyboardShortcut( event );
		}
	}

	return subscribeOwnedListener( element, 'keydown', onKeyDown, true );
};
