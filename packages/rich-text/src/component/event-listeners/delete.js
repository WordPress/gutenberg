/**
 * WordPress dependencies
 */
import { BACKSPACE, DELETE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { remove } from '../../remove';

export default ( props ) => ( element ) => {
	function onKeyDown( event ) {
		const { keyCode } = event;
		const { createRecord, handleChange } = props.current;

		if ( event.defaultPrevented ) {
			return;
		}

		if ( keyCode !== DELETE && keyCode !== BACKSPACE ) {
			return;
		}

		const currentValue = createRecord();
		const { start, end, text } = currentValue;

		// Always handle full content deletion ourselves.
		if ( start === 0 && end !== 0 && end === text.length ) {
			handleChange( remove( currentValue ) );
			event.preventDefault();
		}
	}

	element.addEventListener( 'keydown', onKeyDown );
	return () => {
		element.removeEventListener( 'keydown', onKeyDown );
	};
};
