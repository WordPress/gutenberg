/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Return details about the block lock status.
 *
 * @param {string} clientId The block client Id.
 *
 * @return {Object} Block lock status
 */
export default function useBlockLock( clientId ) {
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
