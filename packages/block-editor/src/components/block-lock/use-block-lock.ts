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
				isLayoutLockedBlock,
				canLayoutLockBlock,
				isPatternLockedBlock,
				isLockedBlock,
				getBlockLockType,
				getLayoutLockedAncestor,
			} = unlock( select( blockEditorStore ) );

			return {
				isEditLocked: isEditLockedBlock( clientId ),
				isMoveLocked: isMoveLockedBlock( clientId ),
				isRemoveLocked: isRemoveLockedBlock( clientId ),
				isLayoutLocked: isLayoutLockedBlock( clientId ),
				canLock: canLockBlockType( getBlockName( clientId ) ),
				canLayoutLock: canLayoutLockBlock( clientId ),
				isPatternLocked: isPatternLockedBlock( clientId ),
				isLocked: isLockedBlock( clientId ),
				lockType: getBlockLockType( clientId ),
				layoutLockedAncestor: getLayoutLockedAncestor( clientId ),
			};
		},
		[ clientId ]
	);
}
