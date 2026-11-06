import type { BlockDropOperation } from '../use-on-block-drop/types';

/**
 * The orientation of a block list.
 */
export type BlockListOrientation = 'horizontal' | 'vertical' | undefined;

/**
 * The side of the target block a dragged block groups on.
 */
export type DropTargetSide = 'left' | 'right';

/**
 * The data of a block that the drop target position is computed from.
 */
export interface DropTargetBlockData {
	/**
	 * Is the block unmodified default block.
	 */
	isUnmodifiedDefaultBlock: boolean;
	/**
	 * Get the bounding client rect of the block, or `null` without an element.
	 */
	getBoundingClientRect: () => DOMRect | null;
	/**
	 * The index of the block.
	 */
	blockIndex: number;
	blockOrientation?: BlockListOrientation;
}

/**
 * Additional options of `getDropTargetPosition`.
 */
export interface DropTargetPositionOptions {
	dropZoneElement?: HTMLElement | null;
	parentBlockClientId?: string | null;
	parentBlockOrientation?: BlockListOrientation;
	rootBlockIndex?: number;
}

/**
 * The index and operation of a drop, and the side to group on.
 */
export type DropTargetPosition =
	| [ number, Exclude< BlockDropOperation, 'group' > ]
	| [ number, 'group', DropTargetSide ];

/**
 * The drop target `useBlockDropZone` keeps between drag events.
 */
export interface BlockDropTarget {
	index: number | null;
	operation: BlockDropOperation;
	nearestSide?: DropTargetSide;
}

/**
 * Configuration data for the drop zone.
 */
export interface BlockDropZoneConfig {
	/**
	 * Optional element to be used as the drop zone.
	 */
	dropZoneElement?: HTMLElement | null;
	/**
	 * The root client id for the block list.
	 */
	rootClientId?: string;
	/**
	 * The client id of the parent block, which before and after drops insert
	 * into.
	 */
	parentClientId?: string | null;
	isDisabled?: boolean;
}

/**
 * A block type, as far as checking its allowed parent goes.
 */
export interface DropTargetBlockType {
	parent?: string[];
}
