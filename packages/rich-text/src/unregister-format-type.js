/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data';
import { removeFilter } from '@wordpress/hooks';

/**
 * Unregisters a format.
 *
 * @param {string} name Format name.
 *
 * @return {WPFormat|undefined} The previous format value, if it has been successfully
 *                              unregistered; otherwise `undefined`.
 */
export function unregisterFormatType( name ) {
	const oldFormat = select( 'core/rich-text' ).getFormatType( name );

	if ( ! oldFormat ) {
		window.console.error(
			`Format ${ name } is not registered.`
		);
		return;
	}

	if ( oldFormat.__experimentalCreatePrepareEditableTree ) {
		removeFilter( 'experimentalRichText', name );
	}

	dispatch( 'core/rich-text' ).removeFormatTypes( name );

	return oldFormat;
}
