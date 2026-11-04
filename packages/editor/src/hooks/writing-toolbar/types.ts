import type { BlockTypeIcon, BlockVariation } from '@wordpress/blocks';

/**
 * A block that supports writing, with the variations it can be transformed
 * between.
 */
export interface WritingBlock {
	name: string;
	title: string;
	icon?: BlockTypeIcon;
	variations: BlockVariation[];
}

/**
 * One entry in the writing toolbar's Style menu: a block, or one of its
 * transform variations, with the typography it renders at.
 */
export interface WritingStyle {
	/** Identifies the style within the menu. */
	key: string;
	/** What the menu calls it. */
	label: string;
	/** The block it turns the selection into. */
	blockName: string;
	/** The icon the block, or the variation, is shown with. */
	icon?: BlockTypeIcon;
	/** The block variation, where the style is one. */
	variation?: string;
	/** The attributes the variation sets. */
	attributes?: Record< string, unknown >;
	/** The font it renders in. */
	fontFamily?: string;
	/** The name of the preset that font belongs to, if it is one. */
	fontFamilyName?: string;
	/** The size it renders at. */
	fontSize?: string;
	/** Whether the selection can be turned into it. */
	disabled?: boolean;
}

/**
 * The writing styles that share a font, as the Style menu groups them.
 */
export interface WritingStyleGroup {
	name?: string;
	fontFamily?: string;
	styles: WritingStyle[];
}
