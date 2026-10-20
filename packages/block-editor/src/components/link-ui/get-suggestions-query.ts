import type { LinkSuggestionsQuery } from '../link-control/types';

interface SearchOptions {
	type: string;
	subtype?: string;
}

export interface SuggestionsQuery extends LinkSuggestionsQuery {
	preferTypes: ( SearchOptions | string )[];
	initialSuggestionsSearchOptions: SearchOptions & { perPage: number };
}

/**
 * Given the Link block's type attribute, return the query params for that one
 * entity type.
 *
 * @param type Link block's type attribute.
 * @param kind Link block's entity of kind (post-type|taxonomy)
 * @return Search query params.
 */
function getOwnTypeSearchOptions(
	type?: string,
	kind?: string
): SearchOptions {
	switch ( type ) {
		case 'post':
		case 'page':
			return { type: 'post', subtype: type };
		case 'category':
			return { type: 'term', subtype: 'category' };
		case 'tag':
			return { type: 'term', subtype: 'post_tag' };
		case 'post_format':
			return { type: 'post-format' };
		default:
			if ( kind === 'taxonomy' ) {
				return { type: 'term', subtype: type };
			}
			if ( kind === 'post-type' ) {
				return { type: 'post', subtype: type };
			}
			// for custom link which has no type
			// always show pages as initial suggestions
			return { type: 'post', subtype: 'page' };
	}
}

/**
 * Given the Link block's type attribute, return the query params to give to
 * /wp/v2/search.
 *
 * @param type Link block's type attribute.
 * @param kind Link block's entity of kind (post-type|taxonomy)
 * @return Search query params.
 */
export function getSuggestionsQuery(
	type?: string,
	kind?: string
): SuggestionsQuery {
	const ownType = getOwnTypeSearchOptions( type, kind );

	return {
		preferTypes: [ ownType.subtype ? ownType : ownType.type ],
		initialSuggestionsSearchOptions: { ...ownType, perPage: 20 },
	};
}
