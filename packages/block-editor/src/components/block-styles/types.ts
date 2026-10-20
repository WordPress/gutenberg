import type { Block, BlockStyle, BlockType } from '@wordpress/blocks';

export interface UseStylesForBlocksArguments {
	/** Block client ID. */
	clientId: string;
	/** Block style switch callback function, needed to select styles. */
	onSwitch?: () => void;
}

/**
 * The block and styles `useStylesForBlocks` selects, empty without a block.
 */
export interface StylesForBlocksSelection {
	block?: Block | null;
	blockType?: BlockType;
	styles?: BlockStyle[];
	className?: string;
}

export interface BlockStylesProps {
	/** Client ID of the block. */
	clientId: string;
	/** Called after a style is selected. */
	onSwitch?: () => void;
	/** Called with the name of the hovered style, or `null`. */
	onHoverClassName?: ( className: string | null ) => void;
}

export interface BlockStylesMenuItemsProps {
	/** Styles to list. */
	stylesToRender?: BlockStyle[];
	/** The active style. */
	activeStyle: BlockStyle;
	/** Called with the selected style. */
	onSelect?: ( style: BlockStyle ) => void;
	/** Called with the hovered style, or `null`. */
	onHoverStyle?: ( style: BlockStyle | null ) => void;
}
