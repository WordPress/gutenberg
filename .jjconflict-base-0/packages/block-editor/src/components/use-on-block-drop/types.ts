import type { Block } from '@wordpress/blocks';

export type WPDropOperation = 'insert' | 'replace';

/**
 * The operation to perform on drop, including grouping with the target block.
 */
export type BlockDropOperation = WPDropOperation | 'group';

/**
 * The block drag and drop data of a drop event.
 */
export interface BlockDropData {
	srcRootClientId: string | null;
	srcClientIds: string[] | null;
	srcIndex: number | null;
	type: string | null;
	blocks: Block[] | null;
}

/**
 * Inserts or replaces blocks at the drop target.
 */
export type InsertOrReplaceBlocks = (
	blocks: Block | Block[],
	updateSelection?: boolean,
	initialPosition?: 0 | -1 | null,
	clientIdsToReplace?: string[]
) => void;

/**
 * Moves blocks to the drop target.
 */
export type MoveBlocks = (
	sourceClientIds: string[],
	sourceRootClientId: string | null,
	insertIndex: number
) => void;

/**
 * Options of `useOnBlockDrop`.
 */
export interface UseOnBlockDropOptions {
	operation?: BlockDropOperation;
	nearestSide?: 'left' | 'right';
}
