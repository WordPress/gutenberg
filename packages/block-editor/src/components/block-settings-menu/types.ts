import type { ComponentProps, ReactElement, ReactNode } from 'react';
import type { BlockType, BlockVariation } from '@wordpress/blocks';
import type { createSlotFill, DropdownMenu } from '@wordpress/components';

type SlotFill = ReturnType< typeof createSlotFill >;

/**
 * The first item fill of the block settings menu, which carries its slot as
 * a static.
 */
export type BlockSettingsMenuFirstItem = SlotFill[ 'Fill' ] & {
	Slot: SlotFill[ 'Slot' ];
};

/**
 * What a copy menu item does with the copied blocks.
 */
export type CopyEventType = 'copy' | 'copyStyles' | 'cut';

export interface CopyMenuItemProps {
	/** Client IDs of the blocks to copy. */
	clientIds: string[];
	/** Called after the blocks are copied. */
	onCopy?: () => void;
	/** Label of the menu item. */
	label?: string;
	/** Keyboard shortcut of the menu item. */
	shortcut?: string;
	/** What the menu item does with the copied blocks. */
	eventType?: CopyEventType;
	/** Whether to update the selection after cutting. */
	__experimentalUpdateSelection?: boolean;
}

export interface BlockSettingsDropdownProps extends Omit<
	Partial< ComponentProps< typeof DropdownMenu > >,
	'children'
> {
	/** Client ID of the block of the menu. */
	clientId?: string;
	/** Client IDs of the blocks of the menu. */
	clientIds: string[];
	/** Extra items, or a function rendering them. */
	children?:
		| ReactElement
		| ReactElement[]
		| ( ( props: { onClose: () => void } ) => ReactNode );
	/** Selects a block after a duplication or removal. */
	__experimentalSelectBlock?: (
		clientId: string,
		updateSelection: boolean
	) => void;
	/** Whether the list view shows content only blocks. */
	isContentOnlyListView?: boolean;
}

export type BlockSettingsMenuProps = BlockSettingsDropdownProps;

export interface BlockModeToggleProps {
	/** Client ID of the block. */
	clientId: string;
	/** Called after the mode is toggled. */
	onToggle?: () => void;
}

export interface BlockHTMLConvertButtonProps {
	/** Client ID of the block. */
	clientId: string;
}

export interface BlockParentSelectorMenuItemProps {
	/** Client ID of the parent block. */
	parentClientId: string;
	/** Block type, or active variation, of the parent block. */
	parentBlockType: BlockType | BlockVariation;
}
