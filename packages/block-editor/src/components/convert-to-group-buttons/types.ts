import type { Block } from '@wordpress/blocks';

/**
 * Contains the properties `ConvertToGroupButton` component needs.
 */
export interface ConvertToGroupButtonProps {
	/**
	 * An array of the selected client ids.
	 */
	clientIds: string[];
	/**
	 * Indicates if the selected blocks can be grouped. An empty selection
	 * gives `0`.
	 */
	isGroupable: boolean | 0;
	/**
	 * Indicates if the selected blocks can be ungrouped.
	 */
	isUngroupable: boolean;
	/**
	 * An array of the selected blocks.
	 */
	blocksSelection: Block[];
	/**
	 * The name of block used for handling grouping interactions.
	 */
	groupingBlockName: string;
	/**
	 * The ungroup transform of the selected block, if it can be ungrouped.
	 */
	onUngroup?:
		| ( (
				attributes: Record< string, unknown >,
				innerBlocks: Block[]
		  ) => Block[] )
		| false;
}

/**
 * Props of `ConvertToGroupButton`.
 */
export interface ConvertToGroupButtonComponentProps extends ConvertToGroupButtonProps {
	onClose?: () => void;
}
