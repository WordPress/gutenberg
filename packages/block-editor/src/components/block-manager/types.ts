import type { BlockType } from '@wordpress/blocks';

/**
 * Props of `BlockManager`.
 */
export interface BlockManagerProps {
	/**
	 * An array of blocks.
	 */
	blockTypes: BlockType[];
	/**
	 * An array of selected blocks.
	 */
	selectedBlockTypes: BlockType[];
	/**
	 * Function to be called when the selected blocks change.
	 */
	onChange: ( selectedBlockTypes: BlockType[] ) => void;
	/**
	 * Whether to show the select all checkbox.
	 */
	showSelectAll?: boolean;
}

/**
 * Props of the block types of one category in `BlockManager`.
 */
export interface BlockManagerCategoryProps {
	title: string;
	blockTypes: BlockType[];
	selectedBlockTypes: BlockType[];
	onChange: ( selectedBlockTypes: BlockType[] ) => void;
}

/**
 * Props of the checklist of block types in `BlockManager`.
 */
export interface BlockTypesChecklistProps {
	blockTypes: BlockType[];
	/**
	 * The names of the checked block types.
	 */
	value: string[];
	onItemChange: ( blockType: BlockType, nextIsChecked: boolean ) => void;
}
