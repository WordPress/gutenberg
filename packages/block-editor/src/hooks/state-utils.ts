import type { BlockType } from '@wordpress/blocks';
import { getBlockDefaultClassName, getBlockType } from '@wordpress/blocks';
import { splitSelectorList } from '@wordpress/global-styles-engine';

type BlockSelector = NonNullable< BlockType[ 'selectors' ] >[ string ];

/**
 * Returns the ancestor part of a block selector whose leading compound names
 * a different block, e.g. `.wp-block-list > ` in List Item's `.wp-block-list > li`.
 * Mirror of `gutenberg_get_state_selector_ancestor()` in PHP.
 *
 * @param selector A single block or feature selector.
 * @param name     Name of the block being scoped.
 * @return The leading compound and its combinator, or an empty string.
 */
function getStateSelectorAncestor( selector: string, name?: string ): string {
	const match = name && selector.match( /^\.(wp-block-[-_a-zA-Z0-9]+)/ );
	if ( ! match || match[ 1 ] === getBlockDefaultClassName( name ) ) {
		return '';
	}

	let ancestorLength = 0;
	let nextCompound = '';
	let depth = 0;

	for ( let i = 0; i < selector.length; i++ ) {
		const char = selector[ i ];

		if ( char === '(' || char === '[' ) {
			depth++;
		} else if ( ( char === ')' || char === ']' ) && depth > 0 ) {
			depth--;
		} else if ( depth === 0 && /[\s>+~]/.test( char ) ) {
			if ( ancestorLength ) {
				break;
			}
			ancestorLength =
				i + selector.slice( i ).match( /^[\s>+~]*/ )![ 0 ].length;
			i = ancestorLength - 1;
		} else if ( depth === 0 && ancestorLength ) {
			nextCompound += char;
		}
	}

	if ( ! nextCompound || nextCompound.includes( '.wp-block-' ) ) {
		return '';
	}

	return selector.slice( 0, ancestorLength );
}

/**
 * Builds a scoped selector from a block selector and optional suffix.
 *
 * If the block selector targets a descendant, the descendant portion is scoped
 * under the provided base selector. Otherwise the base selector itself is used.
 * When the leading compound names a different block (an ancestor outside this
 * block's markup), it is kept and the next compound is scoped instead.
 *
 * @param baseSelector  The block-instance scoping selector.
 * @param blockSelector The block or feature selector from block metadata.
 * @param suffix        Optional selector suffix, e.g. ":hover".
 * @param name          Optional name of the block being scoped.
 * @return The scoped CSS selector.
 */
export function buildScopedBlockSelector(
	baseSelector: string,
	blockSelector: BlockSelector | undefined,
	suffix: string = '',
	name?: string
): string {
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
			const ancestor = getStateSelectorAncestor( selector, name );
			selector = selector.slice( ancestor.length );

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
							`${ ancestor }${ base.trim() }${ selector.slice(
								match[ 0 ].length
							) }${ suffix }`
					)
					.join( ', ' );
			}

			return baseSelectors
				.map( ( base ) => `${ ancestor }${ base.trim() }${ suffix }` )
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
 * @param baseSelector The block-instance scoping class selector.
 * @param name         The block name, used to look up selectors.
 * @return The fully-scoped CSS selector for root state styles.
 */
export function buildRootStyleStateSelector(
	baseSelector: string,
	name: string
): string {
	const rootSelector = getBlockType( name )?.selectors?.root;
	return buildScopedBlockSelector( baseSelector, rootSelector );
}
