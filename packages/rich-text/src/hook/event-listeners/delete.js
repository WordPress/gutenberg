/**
 * WordPress dependencies
 */
import { BACKSPACE, DELETE } from '@wordpress/keycodes';
import { privateApis as composePrivateApis } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { remove } from '../../remove';
import { unlock } from '../../lock-unlock';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

export default ( props ) => ( element ) => {
	function onKeyDown( event ) {
		const { keyCode } = event;

		if ( event.defaultPrevented ) {
			return;
		}

		if ( keyCode !== DELETE && keyCode !== BACKSPACE ) {
			return;
		}

		const { createRecord, handleChange } = props.current;
		const currentValue = createRecord();
		const { start, end, text } = currentValue;

		// Always handle full content deletion ourselves.
		if ( start === 0 && end !== 0 && end === text.length ) {
			handleChange( remove( currentValue ) );
			event.preventDefault();
		}
	}

	return subscribeDelegatedListener( element, 'keydown', onKeyDown );
};
