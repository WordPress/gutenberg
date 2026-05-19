/**
 * Internal dependencies
 */
import { scopeSelector } from '../components/global-styles/utils';

/**
 * Given a block's `selectors.root` value, returns the part of the selector
 * that is relative to the block wrapper — i.e., everything after the first
 * compound selector segment.
 *
 * Examples:
 *   ".wp-block-button .wp-block-button__link" → ".wp-block-button__link"
 *   ".wp-block-foo > .inner"                 → "> .inner"
 *   ".wp-block-foo"                          → null (no descendant)
 *
 * @param {string} rootSelector The block's `selectors.root` value.
 * @return {string|null} Relative selector, or null if rootSelector targets the wrapper itself.
 */
export function getRelativeRootSelector( rootSelector ) {
	// Match everything after the first compound selector (up to the first
	// whitespace or combinator character).
	// Require at least one combinator character (space, >, +, ~) between the
	// first compound selector and the rest. Without this anchor, a greedy
	// quantifier would backtrack into the first token and produce false matches.
	const match = rootSelector.trim().match( /^[^ >+~]+[ >+~](.*)$/ );
	if ( ! match ) {
		return null;
	}
	const rest = match[ 1 ].trim();
	return rest || null;
}

/**
 * Builds a scoped selector from a block selector and optional suffix.
 *
 * If the block selector targets a descendant, the descendant portion is scoped
 * under the provided base selector. Otherwise the base selector itself is used.
 *
 * @param {string} baseSelector  The block-instance scoping selector.
 * @param {string} blockSelector The block or feature selector from block metadata.
 * @param {string} suffix        Optional selector suffix, e.g. ":hover".
 * @return {string} The scoped CSS selector.
 */
export function buildScopedBlockSelector(
	baseSelector,
	blockSelector,
	suffix = ''
) {
	if ( typeof blockSelector !== 'string' || ! blockSelector ) {
		return `${ baseSelector }${ suffix }`;
	}

	const selectors = blockSelector
		.split( ',' )
		.filter( ( selector ) => selector.trim() );

	if ( ! selectors.length ) {
		return `${ baseSelector }${ suffix }`;
	}

	return selectors
		.map( ( selector ) => {
			const relativeSelector = getRelativeRootSelector( selector );
			if ( relativeSelector ) {
				return scopeSelector(
					baseSelector,
					`${ relativeSelector }${ suffix }`
				);
			}
			return `${ baseSelector }${ suffix }`;
		} )
		.join( ', ' );
}
