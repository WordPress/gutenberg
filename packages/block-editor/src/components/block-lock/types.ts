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
