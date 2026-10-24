import type { BlockAttributes } from '../../store/types';

/**
 * The lock status of a block.
 */
export interface BlockLockStatus {
	isEditLocked: boolean;
	isMoveLocked: boolean;
	isRemoveLocked: boolean;
	canLock: boolean;
	isLocked: boolean;
}

/**
 * The lock status shared by a group of blocks.
 */
export interface BlocksLockStatus {
	/**
	 * Whether every block's type allows locking.
	 */
	canLock: boolean;
	/**
	 * Whether every block has at least one lock feature applied.
	 */
	isLocked: boolean;
}

/**
 * The lock a block's `lock` attribute holds.
 */
export type BlockLock = NonNullable< BlockAttributes[ 'lock' ] >;

/**
 * A lock feature's value across a group of blocks: `true` when it is applied
 * to every block, `false` when it is applied to none, and `null` when it is
 * applied to some of them.
 */
export type SharedLockValue = boolean | null;

/**
 * The lock features chosen in the modal. A `null` feature is left as it is on
 * each block.
 */
export interface BlockLockSelection {
	move: SharedLockValue;
	remove: SharedLockValue;
	edit?: SharedLockValue;
}

/**
 * A `templateLock` attribute value.
 */
export type TemplateLock = 'all' | 'insert' | 'contentOnly' | false;

/**
 * The saved lock attributes of a block.
 */
export interface BlockLockState {
	/**
	 * The block's `lock` attribute, without locks inherited from a parent.
	 */
	lock?: BlockLock;
	/**
	 * The block's `templateLock` attribute.
	 */
	templateLock?: TemplateLock;
	/**
	 * Whether the block's type supports a template lock.
	 */
	supportsTemplateLock: boolean;
}

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
 * Props of the block lock controls acting on one or more blocks.
 */
export interface BlocksLockControlProps {
	/**
	 * The client IDs of the blocks.
	 */
	clientIds: string[];
}

/**
 * Props of `BlockLockModal`.
 */
export interface BlockLockModalProps extends BlocksLockControlProps {
	onClose: () => void;
}
