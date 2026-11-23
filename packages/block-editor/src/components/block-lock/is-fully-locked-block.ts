import { STYLES_LOCK_EXCLUDED_BLOCKS } from './constants';

interface BlockLock {
	move?: boolean;
	remove?: boolean;
	styles?: boolean;
}

/**
 * Returns whether a block is fully locked by its own lock: its movement,
 * deletion and, where they can be locked, styles. A fully locked block takes
 * no new inner blocks.
 *
 * @param blockName The name of the block.
 * @param lock      The `lock` attribute of the block.
 *
 * @return Whether the block is fully locked.
 */
export default function isFullyLockedBlock(
	blockName: string | null | undefined,
	lock: BlockLock | undefined
): boolean {
	const canStylesLock =
		!! blockName && ! STYLES_LOCK_EXCLUDED_BLOCKS.includes( blockName );
	return (
		!! lock?.move &&
		!! lock?.remove &&
		( ! canStylesLock || !! lock?.styles )
	);
}
