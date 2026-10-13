import { select, dispatch } from '@wordpress/data';
import { store as richTextStore } from './store';

/**
 * Unregisters a format.
 *
 * @param name Format name.
 *
 * @return The previous format value, if it has
 *                                        been successfully unregistered;
 *                                        otherwise `undefined`.
 */
export function unregisterFormatType( name: string ) {
	const oldFormat = select( richTextStore ).getFormatType( name );

	if ( ! oldFormat ) {
		window.console.error( `Format ${ name } is not registered.` );
		return;
	}

	dispatch( richTextStore ).removeFormatTypes( name );

	return oldFormat;
}
