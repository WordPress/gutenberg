/**
 * WordPress dependencies
 */
import { privateApis as composePrivateApis } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

export default ( props ) => ( element ) => {
	const { keyboardShortcuts } = props.current;
	function onKeyDown( event ) {
		for ( const keyboardShortcut of keyboardShortcuts.current ) {
			keyboardShortcut( event );
		}
	}

	return subscribeDelegatedListener( element, 'keydown', onKeyDown, true );
};
