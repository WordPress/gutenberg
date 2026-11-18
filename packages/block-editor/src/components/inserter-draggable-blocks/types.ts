import type { DragEventHandler, ReactElement } from 'react';
import type { Block, BlockTypeIcon } from '@wordpress/blocks';

/**
 * The parts of a pattern this component reads. A synced user pattern drags as
 * a single `core/block` reference rather than as its inner blocks.
 */
export interface DraggablePattern {
	/** One of `INSERTER_PATTERN_TYPES`. */
	type?: string;
	/** `'unsynced'` for a user pattern that isn't synced. */
	syncStatus?: string;
	/** The pattern's id. */
	id?: number | string;
}

/**
 * What the render prop is called with. The handlers are absent when dragging
 * is disabled, so callers that forward them to something other than a DOM
 * prop need to check.
 */
export interface DraggableRenderProps {
	/** Whether the element should be draggable. */
	draggable: boolean;
	/** Starts the drag. */
	onDragStart?: DragEventHandler;
	/** Ends the drag. */
	onDragEnd?: DragEventHandler;
}

export interface InserterDraggableBlocksProps {
	/** Whether the children can be dragged. */
	isEnabled?: boolean;
	/** The blocks to drag. */
	blocks: Block[];
	/** Renders the drag source. */
	children: ( props: DraggableRenderProps ) => ReactElement;
	/** Icon for the drag chip, defaulting to the block type's icon. */
	icon?: BlockTypeIcon;
	/** The pattern the blocks came from, if any. */
	pattern?: DraggablePattern;
}
