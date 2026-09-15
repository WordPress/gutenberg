/**
 * Entity kinds a Navigation Link block cannot represent. The unscoped search
 * returns attachments, but `kind` on the block only models post types and
 * taxonomies, so selecting one would write an attribute the block does not
 * understand. See `updateAttributes`.
 */
const UNSUPPORTED_KINDS = [ 'media' ];

/**
 * Types the block stores under a different name than the search API returns.
 */
const TYPE_ALIASES = {
	tag: 'post_tag',
	post_format: 'post-format',
};

const ENTITY_KINDS = [ 'post-type', 'taxonomy' ];

function normalizeType( type ) {
	return TYPE_ALIASES[ type ] ?? type;
}

/**
 * Work out which entity type should be listed first.
 *
 * A link that is already bound to an entity keeps searching within its own kind
 * of thing: a Category Link lists categories first, a Page Link lists pages
 * first. A link with nothing bound yet — a freshly appended item, or a custom
 * link — lists pages first.
 *
 * @param {Object} attributes        Navigation Link block attributes.
 * @param {string} [attributes.type] The block's type attribute.
 * @param {string} [attributes.kind] The block's kind attribute.
 * @return {{type: string, kind: string|undefined}} The type and kind to prioritise.
 */
function getPriority( { type, kind } ) {
	if ( ENTITY_KINDS.includes( kind ) ) {
		return { type: normalizeType( type ), kind };
	}

	return { type: 'page', kind: 'post-type' };
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
	const priority = getPriority( attributes );

	const prioritised = [];
	const rest = [];

	for ( const suggestion of suggestions ) {
		if ( UNSUPPORTED_KINDS.includes( suggestion.kind ) ) {
			continue;
		}

		const isPriority =
			normalizeType( suggestion.type ) === priority.type &&
			suggestion.kind === priority.kind;

		( isPriority ? prioritised : rest ).push( suggestion );
	}

	return [ ...prioritised, ...rest ];
}
