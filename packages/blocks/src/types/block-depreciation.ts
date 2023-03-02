/**
 * Internal dependencies
 */
import type { Block } from './block';
import type { BlockType } from './block-type';

/**
 * {@link BlockType} depreciation handler.
 *
 * Defines migration of deprecated blocks to the current version.
 *
 * @see {@link BlockType.deprecated}
 * @public
 */
export interface BlockDeprecation<
	// The new block attribute types.
	NewAttributes extends Record< string, any > = {},
	// The old block attribute types.
	OldAttributes extends Record< string, any > = {}
> extends Pick<
		BlockType< OldAttributes >,
		'attributes' | 'save' | 'supports'
	> {
	/**
	 * A function which, given the attributes and inner blocks of the
	 * parsed block, returns true if the deprecation can handle the block
	 * migration. This is particularly useful in cases where a block is
	 * technically valid even once deprecated, and requires updates to its
	 * attributes or inner blocks.
	 */
	isEligible?( attributes: OldAttributes, innerBlocks: Block[] ): boolean;

	/**
	 * A function which, given the old attributes and inner blocks is
	 * expected to return either the new attributes or a tuple array of
	 * [attributes, innerBlocks] compatible with the block.
	 */
	migrate?(
		attributes: OldAttributes,
		innerBlocks: Block[]
	): NewAttributes | [ NewAttributes, Block[] ];
}
