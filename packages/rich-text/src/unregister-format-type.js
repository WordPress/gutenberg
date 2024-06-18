/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as richTextStore } from './store';

/** @typedef {import('./register-format-type').WPFormat} WPFormat */

/**
 * Unregisters a format.
 *
 * @param {string} name Format name.
 *
 * @return {WPFormat|undefined} The previous format value, if it has
 *                                        been successfully unregistered;
 *                                        otherwise `undefined`.
 */
export function unregisterFormatType( name ) {
	const oldFormat = select( richTextStore ).getFormatType( name );

	if ( ! oldFormat ) {
		window.console.error( `Format ${ name } is not registered.` );
		return;
	}

	dispatch( richTextStore ).removeFormatTypes( name );

	return oldFormat;
}
