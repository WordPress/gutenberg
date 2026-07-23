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
	const { inputEvents } = props.current;
	function onInput( event ) {
		for ( const keyboardShortcut of inputEvents.current ) {
			keyboardShortcut( event );
		}
	}

	return subscribeOwnedListener( element, 'input', onInput );
};
