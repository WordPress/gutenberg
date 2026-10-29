import { BACKSPACE, DELETE } from '@wordpress/keycodes';
import { remove } from '../../remove';
import type { RichTextField } from '../types';

export function onKeyDown( field: RichTextField, event: KeyboardEvent ) {
	const { keyCode } = event;

	if ( event.defaultPrevented ) {
		return;
	}

	if ( keyCode !== DELETE && keyCode !== BACKSPACE ) {
		return;
	}

	const { createRecord, handleChange } = field.props.current;
	const currentValue = createRecord();
	const { start, end, text } = currentValue;

	// Always handle full content deletion ourselves.
	if ( start === 0 && end !== 0 && end === text.length ) {
		handleChange( remove( currentValue ) );
		event.preventDefault();
	}
}
