/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data';

/**
 * Deregisters a format.
 *
 * @param {string} name Format name.
 *
 * @return {?WPFormat} The previous format value, if it has been successfully
 *                     unregistered; otherwise `undefined`.
 */
export function deregisterBlockType( name ) {
	const oldFormat = select( 'core/formats' ).getBlockType( name );

	if ( ! oldFormat ) {
		window.console.error(
			'Format "' + name + '" is not registered.'
		);
		return;
	}

	dispatch( 'core/formats' ).removeBlockTypes( name );

	return oldFormat;
}
