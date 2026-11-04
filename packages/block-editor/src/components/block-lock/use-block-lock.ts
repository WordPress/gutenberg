import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import type { BlockLockStatus } from './types';

/**
 * Return details about the block lock status.
 *
 * @param clientId The block client Id.
 *
 * @return Block lock status
 */
export default function useBlockLock( clientId: string ): BlockLockStatus {
	return useSelect(
		( select ) => {
			const {
				canLockBlockType,
				getBlockName,
				isEditLockedBlock,
				isMoveLockedBlock,
				isRemoveLockedBlock,
				isLockedBlock,
			} = unlock( select( blockEditorStore ) );

			return {
				isEditLocked: isEditLockedBlock( clientId ),
				isMoveLocked: isMoveLockedBlock( clientId ),
				isRemoveLocked: isRemoveLockedBlock( clientId ),
				canLock: canLockBlockType( getBlockName( clientId ) ),
				isLocked: isLockedBlock( clientId ),
			};
		},
		[ clientId ]
	);
}
