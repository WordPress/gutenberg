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
	const { inputEvents } = props.current;
	function onInput( event ) {
		for ( const keyboardShortcut of inputEvents.current ) {
			keyboardShortcut( event );
		}
	}

	return subscribeDelegatedListener( element, 'input', onInput );
};
