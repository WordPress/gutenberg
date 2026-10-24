import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import type { BlocksLockStatus } from './types';

/**
 * Return details about the lock status shared by a group of blocks.
 *
 * @param clientIds The block client IDs.
 *
 * @return Shared block lock status
 */
export default function useBlocksLock( clientIds: string[] ): BlocksLockStatus {
	return useSelect(
		( select ) => {
			const { canLockBlockType, getBlockName, isLockedBlock } = unlock(
				select( blockEditorStore )
			);

			return {
				canLock:
					clientIds.length > 0 &&
					clientIds.every( ( clientId ) =>
						canLockBlockType( getBlockName( clientId ) )
					),
				isLocked:
					clientIds.length > 0 &&
					clientIds.every( ( clientId ) =>
						isLockedBlock( clientId )
					),
			};
		},
		[ clientIds ]
	);
}
