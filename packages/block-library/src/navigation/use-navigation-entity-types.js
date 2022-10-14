/**
 * Internal dependencies
 */
import { DEFAULT_ENTITY_KIND, DEFAULT_ENTITY_TYPE } from './constants';

function isNumeric( v ) {
	if ( v === null || v === undefined || v === '' ) {
		return false;
	}
	return ! isNaN( v ) && isFinite( v );
}

/**
 * Navigation posts `wp_navigation` can be referenced by slug (post_name) or
 * by ID (post_id).
 *
 * By default all Navigation blocks reference the post by `slug` but the ability
 * to reference by ID is retained for backwards compatbility purposes.
 *
 * There are two entity types in Gutenberg with each one representing Navigation
 * entities keyed by slug and ID respectively.
 *
 * This hook determines the correct entity `kind` and `type` arguments based on
 * the type of the `ref` given. Numeric IDs use the "legacy" postType kind whereas
 * the `slug` based version uses a built-in `root` kind.
 *
 * See packages/core-data/src/entities.js
 *
 * @param {number|string} ref a reference to a Navigation post.
 * @return {Array} the kind and type entities to use for the given ref type.
 */
function useNavigationEntityTypes( ref ) {
	let kind, type;

	if ( ! ref || ! isNumeric( ref ) ) {
		kind = DEFAULT_ENTITY_KIND;
		type = DEFAULT_ENTITY_TYPE;
	} else {
		kind = 'postType';
		type = 'wp_navigation';
	}
	return [ kind, type ];
}

export default useNavigationEntityTypes;
