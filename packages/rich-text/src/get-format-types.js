/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

/**
 * Returns all registered formats.
 *
 * @return {Array} Format settings.
 */
export function getFormatTypes() {
	return select( 'core/rich-text' ).getFormatTypes();
}
