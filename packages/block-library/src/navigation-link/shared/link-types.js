/**
 * How the block names a type where it differs from the API.
 *
 * The Tag Link variation is named after the block rather than the `post_tag`
 * taxonomy (see https://github.com/WordPress/gutenberg/pull/24670), and the
 * search API spells the `post_format` taxonomy as `post-format`. Every other
 * type is stored exactly as the API names it, so that it matches its
 * variation and can be looked up again.
 */
const BLOCK_TYPES = {
	post_tag: 'tag',
	'post-format': 'post_format',
};

/**
 * The kind of each built-in link type.
 *
 * Blocks saved before Navigation Link stored a `kind` have only a `type`. For
 * these types the kind is never in doubt, so it can be inferred. A custom type
 * could be a post type or a taxonomy, so it cannot.
 */
const BUILT_IN_KINDS = {
	post: 'post-type',
	page: 'post-type',
	category: 'taxonomy',
	tag: 'taxonomy',
	post_format: 'taxonomy',
};

/**
 * Returns the type to store on a Navigation Link for a type from the API.
 *
 * @param {string} type The post type or taxonomy name, as the API gives it.
 * @return {string} The type to store in the block's `type` attribute.
 */
export function toBlockType( type ) {
	return BLOCK_TYPES[ type ] ?? type;
}

/**
 * Returns the post type or taxonomy name for a Navigation Link's type.
 *
 * @param {string} type The block's `type` attribute.
 * @return {string} The post type or taxonomy name to look the entity up by.
 */
export function toApiType( type ) {
	return type === 'tag' ? 'post_tag' : type;
}

/**
 * Returns a Navigation Link's kind, inferring it for a built-in type saved
 * without one.
 *
 * @param {Object} attributes        Navigation Link block attributes.
 * @param {string} [attributes.type] The link's type.
 * @param {string} [attributes.kind] The link's kind, when it was saved.
 * @return {string|undefined} The link's kind, or undefined when it is unknown.
 */
export function getLinkKind( { type, kind } ) {
	return kind || BUILT_IN_KINDS[ type ];
}
