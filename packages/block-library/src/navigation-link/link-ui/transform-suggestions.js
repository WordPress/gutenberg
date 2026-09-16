/**
 * Remove unsupported kinds from the search results (e.g. media)
 */
const UNSUPPORTED_KINDS = [ 'media' ];

/**
 * Normalize types for necessary conversions. For example, 'tag' needs to be converted to 'post_tag'.
 */
const TYPE_ALIASES = {
	tag: 'post_tag',
	post_format: 'post-format',
};

const ENTITY_KINDS = [ 'post-type', 'taxonomy' ];

/**
 * Describe an entity the way the search API spells it.
 *
 * Applies the aliases above, and falls back to pages for anything not bound to
 * an entity, so that a freshly appended item or a custom link lists pages
 * first.
 *
 * @param {Object} entity        A Navigation Link block's attributes, or a suggestion.
 * @param {string} [entity.type] The entity type.
 * @param {string} [entity.kind] The entity kind (post-type|taxonomy).
 * @return {{type: string, kind: string}} The normalized type and kind.
 */
function normalizeEntity( { type, kind } ) {
	if ( ! ENTITY_KINDS.includes( kind ) ) {
		return { type: 'page', kind: 'post-type' };
	}

	return { type: TYPE_ALIASES[ type ] ?? type, kind };
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
	const priority = normalizeEntity( attributes );

	const prioritised = [];
	const rest = [];

	for ( const suggestion of suggestions ) {
		if ( UNSUPPORTED_KINDS.includes( suggestion.kind ) ) {
			continue;
		}

		const entity = normalizeEntity( suggestion );
		const isPriority =
			entity.type === priority.type && entity.kind === priority.kind;

		if ( isPriority ) {
			prioritised.push( suggestion );
		} else {
			rest.push( suggestion );
		}
	}

	return [ ...prioritised, ...rest ];
}
