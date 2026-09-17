/**
 * Remove unsupported kinds from the search results (e.g. media)
 */
const UNSUPPORTED_KINDS = [ 'media' ];

/**
 * The Tag Link variation is named after the block, not the taxonomy, so it is
 * the one type the block and the search API disagree on beyond punctuation.
 */
const TYPE_ALIASES = {
	tag: 'post_tag',
};

const ENTITY_KINDS = [ 'post-type', 'taxonomy' ];

const DEFAULT_PRIORITY = { type: 'page', kind: 'post-type' };

/**
 * How many results of the link's own type to show before everything else.
 */
export const PREFERRED_COUNT = 3;

/**
 * Below this many characters a search is too vague to say that a result from
 * another type is clearly the one being looked for.
 */
const MIN_LENGTH_TO_ELEVATE = 4;

/**
 * Describe an entity the way the search API spells it.
 *
 * Returns null for anything that is not an entity, such as a custom link or the
 * "Create page" option, so that those are never treated as a match.
 *
 * The search API spells some types with a hyphen where the block stores an
 * underscore: `post-format` against `post_format`, and any custom type with a
 * hyphen in its slug. `updateAttributes` writes the underscored form, so match
 * on that, replacing only the first hyphen exactly as it does.
 *
 * @param {Object} entity        A Navigation Link block's attributes, or a suggestion.
 * @param {string} [entity.type] The entity type.
 * @param {string} [entity.kind] The entity kind (post-type|taxonomy).
 * @return {{type: string, kind: string}|null} The normalized type and kind.
 */
function normalizeEntity( { type, kind } ) {
	if ( ! ENTITY_KINDS.includes( kind ) ) {
		return null;
	}

	const aliased = TYPE_ALIASES[ type ] ?? type;

	return { type: aliased.replace( '-', '_' ), kind };
}

/**
 * How well a title answers what was typed.
 *
 * Only a whole-title or start-of-title match counts as obvious. Anything less
 * is left to the relevance order the results arrived in.
 *
 * @param {string} title      The suggestion's title.
 * @param {string} searchTerm What the user typed.
 * @return {number} 2 for the whole title, 1 for the start of it, otherwise 0.
 */
function getMatchTier( title, searchTerm ) {
	const haystack = ( title ?? '' ).toLowerCase().trim();
	const needle = ( searchTerm ?? '' ).toLowerCase().trim();

	if ( ! haystack || ! needle ) {
		return 0;
	}

	if ( haystack === needle ) {
		return 2;
	}

	return haystack.startsWith( needle ) ? 1 : 0;
}

/**
 * Shapes link suggestions for use within a Navigation.
 *
 * Drops the suggestions a Navigation Link cannot represent, removes duplicates,
 * and orders what is left as:
 *
 * 1. One result of another type, but only when it matches what was typed better
 *    than anything of the link's own type does. Searching "uncategorized" from a
 *    Page Link leads with that category; searching "contact" when a page is
 *    called "Contact" does not, because the page already answers it.
 * 2. Up to `PREFERRED_COUNT` of the link's own type.
 * 3. Everything else, by how well it matches, keeping the order the results
 *    arrived in within each tier.
 *
 * @param {Array}  suggestions Suggestions as returned by fetchLinkSuggestions.
 * @param {Object} attributes  Navigation Link block attributes.
 * @param {string} searchTerm  What the user typed.
 * @return {Array} The suggestions to display.
 */
export function transformSuggestions(
	suggestions,
	attributes = {},
	searchTerm = ''
) {
	// A link with no entity of its own, such as a freshly appended item or a
	// custom link, prefers pages.
	const priority = normalizeEntity( attributes ) ?? DEFAULT_PRIORITY;

	// The same entity can arrive from more than one request, and ids repeat
	// across post types and taxonomies, so identity needs all three parts.
	const seen = new Set();
	const supported = [];

	for ( const suggestion of suggestions ) {
		if ( UNSUPPORTED_KINDS.includes( suggestion.kind ) ) {
			continue;
		}

		const key = `${ suggestion.kind }:${ suggestion.type }:${ suggestion.id }`;

		if ( seen.has( key ) ) {
			continue;
		}

		seen.add( key );
		supported.push( suggestion );
	}

	const isPreferred = ( suggestion ) => {
		const entity = normalizeEntity( suggestion );
		return entity?.type === priority.type && entity?.kind === priority.kind;
	};
	const tierOf = ( suggestion ) =>
		getMatchTier( suggestion.title, searchTerm );
	const bestTier = ( list ) =>
		list.reduce(
			( best, suggestion ) => Math.max( best, tierOf( suggestion ) ),
			0
		);
	// Sorting by tier alone would shuffle equally good matches, so fall back to
	// the order they arrived in.
	const byTier = ( list ) =>
		list
			.map( ( suggestion, index ) => ( { suggestion, index } ) )
			.sort(
				( a, b ) =>
					tierOf( b.suggestion ) - tierOf( a.suggestion ) ||
					a.index - b.index
			)
			.map( ( { suggestion } ) => suggestion );

	const preferred = supported.filter( isPreferred );
	const others = supported.filter(
		( suggestion ) => ! isPreferred( suggestion )
	);

	const ordered = [];
	const canElevate =
		( searchTerm ?? '' ).trim().length >= MIN_LENGTH_TO_ELEVATE;
	const bestOtherTier = bestTier( others );

	if ( canElevate && bestOtherTier > bestTier( preferred ) ) {
		ordered.push( byTier( others )[ 0 ] );
	}

	ordered.push( ...byTier( preferred ).slice( 0, PREFERRED_COUNT ) );

	const used = new Set( ordered );

	ordered.push(
		...byTier(
			supported.filter( ( suggestion ) => ! used.has( suggestion ) )
		)
	);

	return ordered;
}
