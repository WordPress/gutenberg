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
 * @param {string} clientId The block client Id.
 *
 * @return {Object} Block lock status
 */
export default function useBlockLock( clientId ) {
	return useSelect(
		( select ) => {
			const {
				canEditBlock,
				canMoveBlock,
				canRemoveBlock,
				canLockBlockType,
				getBlockName,
				getTemplateLock,
			} = select( blockEditorStore );

			const canEdit = canEditBlock( clientId );
			const canMove = canMoveBlock( clientId );
			const canRemove = canRemoveBlock( clientId );

			return {
				canEdit,
				canMove,
				canRemove,
				canLock: canLockBlockType( getBlockName( clientId ) ),
				isContentLocked: getTemplateLock( clientId ) === 'contentOnly',
				isLocked: ! canEdit || ! canMove || ! canRemove,
			};
		},
		[ clientId ]
	);
}
