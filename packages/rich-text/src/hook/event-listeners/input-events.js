/**
 * WordPress dependencies
 */
import { privateApis as composePrivateApis } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

export default ( props ) => ( element ) => {
	const { events } = props.current;
	function onInput( event ) {
		for ( const callback of events.inputEvents.current ) {
			callback( event );
		}
	}

	return subscribeDelegatedListener( element, 'input', onInput );
};
