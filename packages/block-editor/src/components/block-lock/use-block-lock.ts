import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { getSharedLockValue } from './utils';
import type { BlockLockStatus } from './types';

/**
 * Return details about the lock status of one or more blocks.
 *
 * @param clientIds The block client Id, or the client Ids of several blocks.
 *
 * @return Block lock status
 */
export default function useBlockLock(
	clientIds: string | string[]
): BlockLockStatus {
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
			const ids = Array.isArray( clientIds ) ? clientIds : [ clientIds ];
			const hasBlocks = ids.length > 0;

			return {
				isEditLocked: getSharedLockValue(
					ids.map( ( clientId ) => isEditLockedBlock( clientId ) )
				),
				isMoveLocked: getSharedLockValue(
					ids.map( ( clientId ) => isMoveLockedBlock( clientId ) )
				),
				isRemoveLocked: getSharedLockValue(
					ids.map( ( clientId ) => isRemoveLockedBlock( clientId ) )
				),
				canLock:
					hasBlocks &&
					ids.every( ( clientId ) =>
						canLockBlockType( getBlockName( clientId ) )
					),
				isLocked:
					hasBlocks &&
					ids.every( ( clientId ) => isLockedBlock( clientId ) ),
			};
		},
		[ clientIds ]
	);
}
