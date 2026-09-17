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
 * Shapes link suggestions for use within a Navigation.
 *
 * Suggestions arrive ordered by relevance to the search term. This drops the
 * ones a Navigation Link cannot represent and floats the block's own entity
 * type to the top, leaving relevance ordering intact within each group.
 *
 * @param {Array}  suggestions Suggestions as returned by fetchLinkSuggestions.
 * @param {Object} attributes  Navigation Link block attributes.
 * @return {Array} The suggestions to display.
 */
export function transformSuggestions( suggestions, attributes = {} ) {
	// A link with no entity of its own, such as a freshly appended item or a
	// custom link, lists pages first.
	const priority = normalizeEntity( attributes ) ?? DEFAULT_PRIORITY;

	const prioritised = [];
	const rest = [];

	for ( const suggestion of suggestions ) {
		if ( UNSUPPORTED_KINDS.includes( suggestion.kind ) ) {
			continue;
		}

		const entity = normalizeEntity( suggestion );
		const isPriority =
			entity?.type === priority.type && entity?.kind === priority.kind;

		if ( isPriority ) {
			prioritised.push( suggestion );
		} else {
			rest.push( suggestion );
		}
	}

	return [ ...prioritised, ...rest ];
}
