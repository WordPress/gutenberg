import type { ReactNode } from 'react';

/**
 * Props the block settings menu passes to the controls slot.
 */
export interface BlockSettingsMenuControlsFillProps {
	/** Closes the menu. */
	onClose?: () => void;
	/** Number of blocks of the menu. */
	count?: number;
	/** Client ID of the first block of the menu. */
	firstBlockClientId?: string;
}

export interface BlockSettingsMenuControlsSlotProps {
	/** Props passed to the fills. */
	fillProps?: BlockSettingsMenuControlsFillProps;
	/** Client IDs of the blocks, defaulting to the selected ones. */
	clientIds?: string[] | null;
}

/**
 * Props the controls slot passes to its fills.
 */
export interface BlockSettingsMenuControlsSlotFillProps extends BlockSettingsMenuControlsFillProps {
	/** Whether the selected blocks can be edited. */
	canEdit: boolean;
	/** Names of the selected blocks. */
	selectedBlocks: string[];
	/** Client IDs of the selected blocks. */
	selectedClientIds: string[];
}

export interface BlockSettingsMenuControlsProps {
	/** Menu items, or a function rendering them with the fill props. */
	children?:
		| ReactNode
		| ( (
				fillProps: BlockSettingsMenuControlsSlotFillProps
		  ) => ReactNode );
}
