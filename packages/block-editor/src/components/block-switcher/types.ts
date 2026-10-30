import type { ComponentProps } from 'react';
import type { DropdownMenu, Popover } from '@wordpress/components';
import type { Block, BlockVariation } from '@wordpress/blocks';
import type { BlockPattern, InserterItem } from '../../store/types';

/**
 * A pattern whose blocks were matched with the selected blocks.
 */
export type TransformedBlockPattern = BlockPattern & {
	transformedBlocks: Block[];
};

export interface PreviewBlockPopoverProps {
	/** Blocks to preview. */
	blocks: Block | Block[];
	/** Placement of the popover. */
	placement?: ComponentProps< typeof Popover >[ 'placement' ];
	/** Distance of the popover from its anchor. */
	offset?: number;
	/** Element the popover is anchored to. */
	anchor?: ComponentProps< typeof Popover >[ 'anchor' ];
}

export interface BlockStylesMenuProps {
	/** The block whose styles are listed. */
	hoveredBlock: Pick< Block, 'clientId' >;
	/** Called after a style is selected. */
	onSwitch: () => void;
}

export interface UseBlockVariationTransformsArgs {
	/** Client IDs of the selected blocks. */
	clientIds: string[];
	/** The selected blocks. */
	blocks: Block[];
}

export interface BlockVariationTransformationsProps {
	/** Variations the block can be transformed to. */
	transformations: BlockVariation[];
	/** Called with the name of the selected variation. */
	onSelect: ( name: string ) => void;
	/** The selected blocks. */
	blocks: Block[];
}

export interface BlockVariationTransformationItemProps {
	/** The variation of the item. */
	item: BlockVariation;
	/** Called with the name of the selected variation. */
	onSelect: ( name: string ) => void;
	/** Sets the name of the previewed variation. */
	setHoveredTransformItemName: ( name: string | null ) => void;
}

/**
 * Block transformations, with the text transformations shown first.
 */
export interface GroupedTransforms {
	priorityTextTransformations: InserterItem[];
	restTransformations: InserterItem[];
}

export interface BlockTransformationsMenuProps {
	/** Class name of the menu groups. */
	className?: string;
	/** Block types the blocks can be transformed to. */
	possibleBlockTransformations: InserterItem[];
	/** Variations the block can be transformed to. */
	possibleBlockVariationTransformations?: BlockVariation[];
	/** Called with the block type and variation the blocks transform to. */
	onSelect: ( name: string, variationName?: string ) => void;
	/** Called with the name of the variation the block transforms to. */
	onSelectVariation: ( name: string ) => void;
	/** The selected blocks. */
	blocks: Block[];
}

export interface RestTransformationItemsProps {
	/** Transformations shown after the text ones. */
	restTransformations: InserterItem[];
	/** Called with the block type and variation the blocks transform to. */
	onSelect: ( name: string, variationName?: string ) => void;
	/** Sets the previewed transformation. */
	setHoveredTransformItem: ( item: InserterItem | null ) => void;
}

export interface BlockTransformationItemProps {
	/** The transformation of the item. */
	item: InserterItem;
	/** Called with the block type and variation the blocks transform to. */
	onSelect: ( name: string, variationName?: string ) => void;
	/** Sets the previewed transformation. */
	setHoveredTransformItem: ( item: InserterItem | null ) => void;
}

export interface PatternTransformationsMenuProps {
	/** The selected blocks. */
	blocks: Block[];
	/** Patterns the blocks can be transformed to. */
	patterns: BlockPattern[];
	/** Called with the blocks of the selected pattern. */
	onSelect: ( transformedBlocks: Block[] ) => void;
}

export interface TransformedPatternsProps {
	/** Patterns matched with the selected blocks. */
	patterns: TransformedBlockPattern[];
	/** Called with the blocks of the selected pattern. */
	onSelect: ( transformedBlocks: Block[] ) => void;
}

export interface BlockPatternProps {
	/** The pattern to preview. */
	pattern: TransformedBlockPattern;
	/** Called with the blocks of the pattern. */
	onSelect: ( transformedBlocks: Block[] ) => void;
}

export interface BlockSwitcherDropdownMenuContentsProps {
	/** Closes the dropdown. */
	onClose: () => void;
	/** Client IDs of the selected blocks. */
	clientIds: string[];
}

export interface BlockSwitcherProps {
	/** The icon of the toggle. */
	children?: ComponentProps< typeof DropdownMenu >[ 'icon' ];
	/** Client IDs of the selected blocks. */
	clientIds: string[];
	/** Label of the toggle. */
	label: string;
	/** Text of the toggle. */
	text?: string;
}
