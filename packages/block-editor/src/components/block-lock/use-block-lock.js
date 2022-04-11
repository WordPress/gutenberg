/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Return details about the block lock status.
 *
 * @param {string}  clientId    The block client Id.
 * @param {boolean} checkParent Optional. The status is derived from the parent `templateLock`
 *                              when the current block's lock state isn't defined.
 *
 * @return {Object} Block lock status
 */
export default function useBlockLock( clientId, checkParent = false ) {
	return useSelect(
		( select ) => {
			const {
				canEditBlock,
				canMoveBlock,
				canRemoveBlock,
				canLockBlockType,
				getBlockName,
				getBlockRootClientId,
			} = select( blockEditorStore );
			const rootClientId = checkParent
				? getBlockRootClientId( clientId )
				: null;

			const canEdit = canEditBlock( clientId );
			const canMove = canMoveBlock( clientId, rootClientId );
			const canRemove = canRemoveBlock( clientId, rootClientId );

			return {
				canEdit,
				canMove,
				canRemove,
				canLock: canLockBlockType( getBlockName( clientId ) ),
				isLocked: ! canEdit || ! canMove || ! canRemove,
			};
		},
		[ clientId, checkParent ]
	);
}
