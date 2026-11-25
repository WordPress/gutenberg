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
				isStylesLockedBlock,
				isMoveLockedBlock,
				isRemoveLockedBlock,
				isLayoutLockedBlock,
				canLayoutLockBlock,
				isPatternLockedBlock,
				isLockedBlock,
				hasOwnBlockLock,
				getBlockLockType,
				getParentSectionBlock,
			} = unlock( select( blockEditorStore ) );

			return {
				isEditLocked: isEditLockedBlock( clientId ),
				isStylesLocked: isStylesLockedBlock( clientId ),
				isMoveLocked: isMoveLockedBlock( clientId ),
				isRemoveLocked: isRemoveLockedBlock( clientId ),
				isLayoutLocked: isLayoutLockedBlock( clientId ),
				canLock: canLockBlockType( getBlockName( clientId ) ),
				canLayoutLock: canLayoutLockBlock( clientId ),
				isPatternLocked: isPatternLockedBlock( clientId ),
				isLocked: isLockedBlock( clientId ),
				hasOwnLock: hasOwnBlockLock( clientId ),
				lockType: getBlockLockType( clientId ),
				lockingSection: getParentSectionBlock( clientId ) ?? null,
			};
		},
		[ clientId ]
	);
}
