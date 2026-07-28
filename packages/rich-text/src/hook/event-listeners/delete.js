/**
 * WordPress dependencies
 */
import { BACKSPACE, DELETE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { remove } from '../../remove';
import { subscribeOwnedListener } from '../../subscribe-owned-listener';

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

	return subscribeOwnedListener( element, 'keydown', onKeyDown );
};
