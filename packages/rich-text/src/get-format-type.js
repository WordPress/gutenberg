/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

/**
 * Returns a registered format type.
 *
 * @param {string} name Format name.
 *
 * @return {?Object} Format type.
 */
export function getFormatType( name ) {
	return select( 'core/rich-text' ).getFormatType( name );
}
