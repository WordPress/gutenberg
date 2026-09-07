import { PATTERN_OVERRIDE_META_KEY } from '../constants';

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
export function isPatternOverride( record ) {
	return !! record?.meta?.[ PATTERN_OVERRIDE_META_KEY ];
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
 * @return {Object} The pattern, with `title`, `content` and `overrideId` from
 *                  the copy when edited.
 */
export function resolvePatternOverride( pattern, records ) {
	const override = records?.find(
		( record ) =>
			record.meta?.[ PATTERN_OVERRIDE_META_KEY ] === pattern.name
	);
	if ( ! override ) {
		return pattern;
	}
	return {
		...pattern,
		title: override.title?.raw ?? pattern.title,
		content: override.content?.raw ?? pattern.content,
		overrideId: override.id,
	};
}
