/**
 * Internal dependencies
 */
import { wpDataSelect } from './wp-data-select';

/**
 * Returns a promise which resolves with the current post type name.
 *
 * @return {Promise} Promise resolving with current post type name.
 */
export async function getCurrentPostType() {
	return wpDataSelect( 'core/editor', 'getCurrentPostType' );
}

/**
 * Returns a promise which resolves with the post type object for the given post type name.
 *
 * @param  {string}  name Name of the post type.
 * @return {Promise}      Promise resolving with post type object.
 */
export async function getPostType( name ) {
	return wpDataSelect( 'core', 'getPostType', name );
}
