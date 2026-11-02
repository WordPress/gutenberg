import { remove } from '../../remove';
import type { RichTextField } from '../types';

export function onBeforeInput( field: RichTextField, event: InputEvent ) {
	if (
		event.defaultPrevented ||
		! event.inputType.startsWith( 'deleteContent' )
	) {
		return;
	}

	const { createRecord, handleChange } = field.props.current;
	const currentValue = createRecord();
	const { start, end, text } = currentValue;

	// Delete all content ourselves. In WebKit, deleting all content of a
	// `position: relative` element inside a larger editing host removes
	// the element itself (https://bugs.webkit.org/show_bug.cgi?id=186377).
	if ( start === 0 && end !== 0 && end === text.length ) {
		handleChange( remove( currentValue ) );
		event.preventDefault();
	}
}
