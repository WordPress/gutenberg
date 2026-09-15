// How many results to show initially and per search.
const PER_PAGE = 20;

/**
 * Given the Link block's type attribute, return the query params that describe
 * that single entity type for /wp/v2/search.
 *
 * @param {string} type Link block's type attribute.
 * @param {string} kind Link block's entity of kind (post-type|taxonomy)
 * @return {{ type?: string, subtype?: string, perPage: number }|undefined} Search query params, or
 * undefined when the block is not bound to an entity type (e.g. a custom link).
 */
function getEntitySearchOptions( type, kind ) {
	switch ( type ) {
		case 'post':
		case 'page':
			return { type: 'post', subtype: type, perPage: PER_PAGE };
		case 'category':
			return { type: 'term', subtype: 'category', perPage: PER_PAGE };
		case 'tag':
			return { type: 'term', subtype: 'post_tag', perPage: PER_PAGE };
		case 'post_format':
			return { type: 'post-format', perPage: PER_PAGE };
		default:
			if ( kind === 'taxonomy' ) {
				return { type: 'term', subtype: type, perPage: PER_PAGE };
			}
			if ( kind === 'post-type' ) {
				return { type: 'post', subtype: type, perPage: PER_PAGE };
			}
			return undefined;
	}
}

/**
 * Given the Link block's type attribute, return the query params to give to
 * /wp/v2/search.
 *
 * The search itself is deliberately unscoped so that every entity type is
 * reachable from a single search, matching the link UI used by RichText. The
 * block's own type only steers which suggestions are shown before the user has
 * typed anything; ordering of the typed results is handled separately by
 * `transformSuggestions`.
 *
 * @param {string} type Link block's type attribute.
 * @param {string} kind Link block's entity of kind (post-type|taxonomy)
 * @return {Object} Search query params.
 */
export function getSuggestionsQuery( type, kind ) {
	return {
		perPage: PER_PAGE,
		initialSuggestionsSearchOptions: getEntitySearchOptions(
			type,
			kind
			// Without an entity type of its own, always show pages first.
		) ?? { type: 'post', subtype: 'page', perPage: PER_PAGE },
	};
}
