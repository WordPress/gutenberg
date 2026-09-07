import { PATTERN_SLUG_META_KEY } from '../constants';

/**
 * Determines whether a block is overridable.
 *
 * @param {WPBlock} block The block to test.
 *
 * @return {boolean} `true` if a block is overridable, `false` otherwise.
 */
export function isOverridableBlock( block ) {
	return (
		!! block.attributes.metadata?.name &&
		!! block.attributes.metadata?.bindings &&
		Object.values( block.attributes.metadata.bindings ).some(
			( binding ) => binding.source === 'core/pattern-overrides'
		)
	);
}

/**
 * Whether a `wp_block` record is the edited copy of a registered pattern.
 *
 * @param {Object} record The `wp_block` record.
 * @return {boolean} Whether the record is an edited copy.
 */
export function isPatternCustomization( record ) {
	return !! record?.meta?.[ PATTERN_SLUG_META_KEY ];
}

/**
 * Returns a registered pattern merged with its edited copy when one exists.
 *
 * The copy (a `wp_block` record carrying the `wp_pattern_slug` meta) is the
 * single source of the edited title and content; everything else, including
 * the name used as identity, stays the registered pattern's.
 *
 * @param {Object}   pattern The registered pattern.
 * @param {Object[]} records The `wp_block` records.
 * @return {Object} The pattern, with `title`, `content` and `customizationId` from
 *                  the copy when edited.
 */
export function applyPatternCustomization( pattern, records ) {
	const customization = records?.find(
		( record ) => record.meta?.[ PATTERN_SLUG_META_KEY ] === pattern.name
	);
	if ( ! customization ) {
		return pattern;
	}
	return {
		...pattern,
		title: customization.title?.raw ?? pattern.title,
		content: customization.content?.raw ?? pattern.content,
		customizationId: customization.id,
	};
}
