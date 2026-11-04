import type { ReactNode } from 'react';

/**
 * The block actions BlockActions passes to its render function.
 */
export interface BlockActionsRenderProps {
	canCopyStyles: boolean;
	canDuplicate: boolean;
	canInsertBlock: boolean;
	canRemove: boolean;
	onDuplicate: () => unknown;
	onRemove: () => unknown;
	onInsertBefore: () => void;
	onInsertAfter: () => void;
	onGroup: () => void;
	onUngroup: () => void;
	onCopy: () => void;
	onPasteStyles: () => Promise< void >;
}

export interface BlockActionsProps {
	/** Client IDs of the blocks to act on. */
	clientIds: string[];
	/** Renders the actions. */
	children: ( props: BlockActionsRenderProps ) => ReactNode;
	/** Whether to update the selection after duplicating or removing. */
	__experimentalUpdateSelection?: boolean;
}
