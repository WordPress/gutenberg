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

interface BlockDraggableBaseProps {
	/** Whether to append the cloned element to the owner document body. */
	appendToOwnerDocument?: boolean;
	/** Renders the draggable element. */
	children: ( props: BlockDraggableRenderProps ) => React.JSX.Element | null;
	/** Client IDs of the dragged blocks. */
	clientIds: string[];
	/** Class name of the cloned element. */
	cloneClassname?: string;
	/** Called when the drag starts. */
	onDragStart?: () => void;
	/** Called when the drag ends. */
	onDragEnd?: () => void;
	/** Whether the chip indicates a drop target that won't accept the blocks. */
	fadeWhenDisabled?: boolean;
}

export type BlockDraggableProps = BlockDraggableBaseProps &
	(
		| {
				/** Component shown while dragging, instead of the chip. */
				dragComponent?: Exclude< ReactNode, null >;
				/** ID of the element to clone, unused while a component is shown. */
				elementId?: string;
		  }
		| {
				/** Clones the element instead of showing a component. */
				dragComponent: null;
				/** ID of the element to clone while dragging. */
				elementId: string;
		  }
	);

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
