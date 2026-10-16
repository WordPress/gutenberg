import type { DragEvent, ReactNode } from 'react';
import type { BlockTypeIcon } from '@wordpress/blocks';

/**
 * Props BlockDraggable passes to its render function.
 */
export interface BlockDraggableRenderProps {
	draggable: boolean;
	onDragStart?: ( event: DragEvent ) => void;
	onDragEnd?: ( event: DragEvent ) => void;
}

export interface BlockDraggableProps {
	/** Whether to append the cloned element to the owner document body. */
	appendToOwnerDocument?: boolean;
	/** Renders the draggable element. */
	children: ( props: BlockDraggableRenderProps ) => React.JSX.Element | null;
	/** Client IDs of the dragged blocks. */
	clientIds: string[];
	/** Class name of the cloned element. */
	cloneClassname?: string;
	/** ID of the element to clone when no drag component is shown. */
	elementId?: string;
	/** Called when the drag starts. */
	onDragStart?: () => void;
	/** Called when the drag ends. */
	onDragEnd?: () => void;
	/** Whether the chip indicates a drop target that won't accept the blocks. */
	fadeWhenDisabled?: boolean;
	/** Component shown while dragging, or `null` to show none. */
	dragComponent?: ReactNode;
}

export interface BlockDraggableChipProps {
	/** How many blocks are being dragged. */
	count: number;
	/** Shown in place of the count. */
	icon?: BlockTypeIcon;
	/** Labels the chip as a pattern when there's no icon. */
	isPattern?: boolean;
	/** Adds the indicator shown when the drop target won't accept the blocks. */
	fadeWhenDisabled?: boolean;
}
