import { isKeyboardEvent } from '@wordpress/keycodes';
import type { RichTextField } from '../types';

/**
 * Prevents default behaviors for key combinations otherwise handled
 * internally by RichText.
 *
 * @param field
 * @param event
 */
export function onKeyDown( field: RichTextField, event: KeyboardEvent ) {
	if (
		isKeyboardEvent.primary( event, 'z' ) ||
		isKeyboardEvent.primary( event, 'y' ) ||
		isKeyboardEvent.primaryShift( event, 'z' )
	) {
		event.preventDefault();
	}
}
