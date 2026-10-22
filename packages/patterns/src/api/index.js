import { getBlockType, parse } from '@wordpress/blocks';
import { PATTERN_OVERRIDES_BINDING_SOURCE } from '../constants';

const INNER_BLOCKS = 'innerBlocks';
const BLOCK_MARKUP = /^\s*<!-- wp:/;

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

function isPatternOverridesBinding( binding ) {
	return binding?.source === PATTERN_OVERRIDES_BINDING_SOURCE;
}

/**
 * Parses the overridden inner blocks of a block: serialized block markup, or
 * an empty string for no inner blocks. The pattern overrides bindings inside
 * the markup are removed without applying any override to them, as the markup
 * already holds their values.
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
	return bakeAndStripPatternOverrides( parse( value ) );
}

/**
 * Applies the overrides of a pattern instance to the given blocks and removes
 * their pattern overrides bindings, so that the blocks no longer depend on the
 * instance. The overridden values of a named block become its attributes and,
 * if the block binds its inner blocks, an overridden `innerBlocks` value
 * replaces them.
 *
 * @param {WPBlock[]} blocks      The blocks, which are not mutated.
 * @param {Object}    [overrides] The overrides of the pattern instance, keyed
 *                                by block name.
 *
 * @return {WPBlock[]} The new blocks.
 */
export function bakeAndStripPatternOverrides( blocks, overrides ) {
	return blocks.map( ( block ) => {
		const { metadata } = block.attributes;
		if (
			! metadata?.bindings ||
			! Object.values( metadata.bindings ).some(
				isPatternOverridesBinding
			)
		) {
			return {
				...block,
				innerBlocks: bakeAndStripPatternOverrides(
					block.innerBlocks,
					overrides
				),
			};
		}

		const blockType = getBlockType( block.name );
		const attributes = { ...block.attributes };
		let innerBlocks;
		const blockOverrides = metadata.name
			? overrides?.[ metadata.name ]
			: undefined;
		for ( const [ key, value ] of Object.entries( blockOverrides ?? {} ) ) {
			if ( key === INNER_BLOCKS ) {
				if ( isPatternOverridesBinding( metadata.bindings[ key ] ) ) {
					innerBlocks = parseInnerBlocksOverride( value );
				}
			} else if ( blockType?.attributes?.[ key ] ) {
				// An empty string means the value was cleared.
				attributes[ key ] = value === '' ? undefined : value;
			}
		}

		const { bindings, ...newMetadata } = metadata;
		const otherBindings = Object.fromEntries(
			Object.entries( bindings ).filter(
				( [ , binding ] ) => ! isPatternOverridesBinding( binding )
			)
		);
		if ( Object.keys( otherBindings ).length ) {
			newMetadata.bindings = otherBindings;
		}
		attributes.metadata = Object.keys( newMetadata ).length
			? newMetadata
			: undefined;

		return {
			...block,
			attributes,
			innerBlocks:
				innerBlocks ??
				bakeAndStripPatternOverrides( block.innerBlocks, overrides ),
		};
	} );
}
