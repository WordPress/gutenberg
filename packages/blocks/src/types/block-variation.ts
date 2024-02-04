/**
 * Internal dependencies
 */
import type { Block } from './block';
import type { BlockAttributes } from './block-attributes';
import type { BlockIcon } from './block-icon';
import type { BlockExampleInnerBlock, BlockType } from './block-type';
/**
 * Type to scope where a variation is applicable.
 *
 * @public
 */
export type BlockVariationScope = 'block' | 'inserter' | 'transform';

/**
 * TODO Undocumented
 *
 * @public
 */
export type InnerBlockTemplate = [
	string,
	BlockAttributes?,
	InnerBlockTemplate[]?,
];

/**
 * Describes a related variations of a {@link BlockType}.
 *
 * Differentiated by setting some initial attributes or inner blocks.
 *
 * Used in [registration.js](../api/registration.js)
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-variations/ Block Variations}
 * @public
 */
export interface BlockVariation<
	Attributes extends BlockAttributes = BlockAttributes,
> {
	/**
	 * The unique and machine-readable name.
	 */
	name: string;

	/**
	 * A human-readable variation title.
	 */
	title: string;

	/**
	 * A detailed variation description.
	 */
	description?: string;

	/**
	 * Block type category classification, used in search interfaces to arrange block types by category.
	 */
	category?: string;

	/**
	 * An icon helping to visualize the variation.
	 */
	icon?: BlockIcon;

	/**
	 * Indicates whether the current variation is the default one. Defaults to `false`.
	 */
	isDefault?: boolean;

	/**
	 * Values which override block attributes.
	 */
	attributes?: Attributes;

	/**
	 * Initial configuration of nested blocks.
	 */
	innerBlocks?: Block | InnerBlockTemplate[];

	/**
	 * Example provides structured data for the block preview. You can set to `undefined` to disable
	 * the preview shown for the block type.
	 */
	example?:
		| BlockExampleInnerBlock
		| {
				attributes: Attributes;
				innerBlocks?: InnerBlockTemplate[];
		  };

	/**
	 * The list of scopes where the variation is applicable. When not provided, it assumes all available scopes.
	 */
	scope?: BlockVariationScope[];

	/**
	 * An array of terms (which can be translated) that help users discover the variation  while searching.
	 */
	keywords?: string[];

	/**
	 * This can be a function or an array of block attributes. Function that accepts a block's
	 * attributes and the variation's attributes and determines if a variation is active. This
	 * function doesn't try to find a match dynamically based on all block's attributes, as in many
	 * cases some attributes are irrelevant. An example would be for `embed` block where we only care
	 * about `providerNameSlug` attribute's value. We can also use a `string[]` to tell which
	 * attributes should be compared as a shorthand. Each attributes will be matched and the variation
	 * will be active if all of them are matching.
	 */
	isActive?:
		| ( (
				blockAttributes: Attributes,
				variationAttributes: Attributes
		  ) => boolean )
		| string[];
}
