import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

/**
 * Turns whatever an ability threw into a message the user can read.
 *
 * @param error The value the ability threw.
 * @return The message to show the user.
 */
export function getErrorMessage( error: unknown ): string {
	let message = '';
	if ( typeof error === 'object' && error !== null ) {
		if ( 'message' in error && typeof error.message === 'string' ) {
			message = error.message;
		}
		// An error with an empty message still names its type, e.g. `TypeError`.
		if ( ! message && 'name' in error && typeof error.name === 'string' ) {
			message = error.name;
		}
	} else if ( error !== null && error !== undefined ) {
		message = String( error );
	}

	if ( ! message ) {
		return __(
			'This ability couldn’t run. Check the browser console for details.'
		);
	}

	// REST errors can carry HTML entities, such as `&#8217;`.
	return decodeEntities( message );
}
