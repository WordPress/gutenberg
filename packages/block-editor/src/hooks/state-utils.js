/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { splitSelectorList } from '@wordpress/global-styles-engine';

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
		return splitSelectorList( baseSelector )
			.map( ( selector ) => `${ selector.trim() }${ suffix }` )
			.join( ', ' );
	}

	const baseSelectors = splitSelectorList( baseSelector ).filter(
		( selector ) => selector.trim()
	);
	const selectors = splitSelectorList( blockSelector ).filter( ( selector ) =>
		selector.trim()
	);

	if ( ! selectors.length ) {
		return baseSelectors
			.map( ( selector ) => `${ selector.trim() }${ suffix }` )
			.join( ', ' );
	}

	return selectors
		.map( ( selector ) => {
			selector = selector.trim();

			/*
			 * Replace only the leading block selector part (e.g. class name,
			 * attribute selector, ID, or tag name) with the block instance selector.
			 * Preserve anything after that prefix, including modifier classes on the
			 * same element and combinators without spaces.
			 */
			const match = selector.match( /^([.#]?[-_a-zA-Z0-9]+|\[[^\]]+\])/ );
			if ( match ) {
				return baseSelectors
					.map(
						( base ) =>
							`${ base.trim() }${ selector.slice(
								match[ 0 ].length
							) }${ suffix }`
					)
					.join( ', ' );
			}

			return baseSelectors
				.map( ( base ) => `${ base.trim() }${ suffix }` )
				.join( ', ' );
		} )
		.join( ', ' );
}

/**
 * Builds the scoped selector for root block style state styles.
 *
 * Uses the block's `selectors.root` to determine which element should receive
 * root-level state styles. If `selectors.root` describes a descendant element
 * (e.g. `.wp-block-button .wp-block-button__link`), the relative portion is
 * scoped under `baseSelector`. If no descendant is present, falls back to the
 * base selector.
 *
 * @param {string} baseSelector The block-instance scoping class selector.
 * @param {string} name         The block name, used to look up selectors.
 * @return {string} The fully-scoped CSS selector for root state styles.
 */
export function buildRootStyleStateSelector( baseSelector, name ) {
	const rootSelector = getBlockType( name )?.selectors?.root;
	return buildScopedBlockSelector( baseSelector, rootSelector );
}

/**
 * Builds the scoped CSS selector for a block state (e.g. :hover, :focus).
 *
 * Uses the block's `selectors.root` to determine which element the state
 * pseudo-class should apply to. If `selectors.root` describes a descendant
 * element (e.g. ".wp-block-button .wp-block-button__link"), the relative
 * portion (".wp-block-button__link") is scoped under `baseSelector`. If no
 * descendant is present, falls back to appending the state to `baseSelector`.
 *
 * @param {string} baseSelector The block-instance scoping class selector.
 * @param {string} name         The block name, used to look up selectors.
 * @param {string} state        The pseudo-class string, e.g. ":hover".
 * @return {string} The fully-scoped CSS selector for this state.
 */
export function buildPseudoStyleStateSelector( baseSelector, name, state ) {
	return `${ buildRootStyleStateSelector( baseSelector, name ) }${ state }`;
}

export function buildStateSelector( baseSelector, name, state ) {
	const rootSelector = getBlockType( name )?.selectors?.root;
	return buildScopedBlockSelector( baseSelector, rootSelector, state );
}

/**
 * Builds the CSS selector used to preview a state on the editor canvas,
 * scoped to a specific block instance via its `data-block` attribute.
 *
 * For blocks whose `selectors.root` targets a descendant element
 * (e.g. ".wp-block-button .wp-block-button__link"), the selector targets
 * that descendant inside the block wrapper. Otherwise it targets the wrapper
 * itself.
 *
 * @param {string} clientId The block's clientId.
 * @param {string} name     The block name, used to look up selectors.
 * @return {string} CSS selector scoped to this block instance.
 */
export function buildCanvasStateSelector( clientId, name ) {
	const rootSelector = getBlockType( name )?.selectors?.root;
	return buildScopedBlockSelector(
		`[data-block="${ clientId }"]`,
		rootSelector
	);
}
