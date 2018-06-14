/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

/**
 * Returns all the block categories.
 *
 * @return {Array} Block categories.
 */
export function getCategories() {
	return select( 'core/blocks' ).getCategories();
}
