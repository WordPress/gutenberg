import { parse } from '@wordpress/blocks';

// Block markup, which only HTML whitespace may precede, as on the server.
const BLOCK_MARKUP = /^[ \t\n\f\r]*<!-- wp:/;

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
 * Parses the overridden inner blocks of a block: serialized block markup, or
 * an empty string for no inner blocks.
 *
 * @param {unknown} value The `innerBlocks` value of the block's overrides.
 *
 * @return {WPBlock[]|undefined} The inner blocks, or `undefined` if the value
 *                               does not override them.
 */
export function parseInnerBlocksOverride( value ) {
	if (
		typeof value !== 'string' ||
		( value !== '' && ! BLOCK_MARKUP.test( value ) )
	) {
		return undefined;
	}
	return parse( value );
}
