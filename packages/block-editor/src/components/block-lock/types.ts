import type { BlockAttributes } from '../../store/types';

declare global {
	interface Window {
		/**
		 * Whether the block lock menu experiment is enabled.
		 */
		__experimentalBlockLockMenu?: boolean;
	}
}

/**
 * The lock status of a block.
 */
export interface BlockLockStatus {
	isEditLocked: boolean;
	/**
	 * Whether the controls of the Styles tab are locked.
	 */
	isStylesLocked: boolean;
	isMoveLocked: boolean;
	isRemoveLocked: boolean;
	/**
	 * Whether the inner layout of the block is locked.
	 */
	isLayoutLocked: boolean;
	canLock: boolean;
	/**
	 * Whether the inner layout of the block can be locked.
	 */
	canLayoutLock: boolean;
	/**
	 * Whether the layout of the block is locked by its pattern, which is
	 * changed by editing or detaching the pattern.
	 */
	isPatternLocked: boolean;
	isLocked: boolean;
	/**
	 * Whether the block has a lock of its own, not counting the layout of a
	 * pattern, which is the pattern's.
	 */
	hasOwnLock: boolean;
	/**
	 * How much of the block is locked: every property it supports (`full`),
	 * some of them (`partial`), or none.
	 */
	lockType: BlockLockType;
	/**
	 * Client ID of the pattern or other content-only section the block is in,
	 * whose blocks can't change their lock, or `null`.
	 */
	lockingSection: string | null;
}

/**
 * How much of a block is locked.
 */
export type BlockLockType = 'none' | 'partial' | 'full';

/**
 * Props of the block lock controls acting on several blocks.
 */
export interface BlockLockMenuProps {
	/**
	 * The client IDs of the blocks the menu locks.
	 */
	clientIds: string[];
}

/**
 * The lock a block's `lock` attribute holds.
 */
export type BlockLock = NonNullable< BlockAttributes[ 'lock' ] >;

/**
 * Props of the block lock controls acting on a block.
 */
export interface BlockLockControlProps {
	/**
	 * The client ID of the block.
	 */
	clientId: string;
}

/**
 * Props of `BlockLockModal`.
 */
export interface BlockLockModalProps extends BlockLockControlProps {
	onClose: () => void;
}
