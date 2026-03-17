/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Helper function to get the title of a post item.
 * This is duplicated from the `@wordpress/fields` package.
 * `packages/fields/src/actions/utils.ts`
 *
 * @param {Object} item The post item.
 * @return {string} The title of the item, or an empty string if the title is not found.
 */
export function getItemTitle( item ) {
	if ( typeof item.title === 'string' ) {
		return decodeEntities( item.title );
	}
	if ( item.title && 'rendered' in item.title ) {
		return decodeEntities( item.title.rendered );
	}
	if ( item.title && 'raw' in item.title ) {
		return decodeEntities( item.title.raw );
	}
	return '';
}
