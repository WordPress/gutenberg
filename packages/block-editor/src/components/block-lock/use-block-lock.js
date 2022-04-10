/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Return details about the block lock state.
 *
 * @param {string}  clientId  The block client Id.
 * @param {boolean} checkRoot Optional check for root client ID of block list.
 *
 * @return {Object} Block lock state
 */
export default function useBlockLock( clientId, checkRoot = false ) {
	return useSelect(
		( select ) => {
			const {
				canMoveBlock,
				canRemoveBlock,
				canLockBlockType,
				getBlockName,
				getBlockRootClientId,
			} = select( blockEditorStore );
			const rootClientId = checkRoot
				? getBlockRootClientId( clientId )
				: null;

			return {
				canMove: canMoveBlock( clientId, rootClientId ),
				canRemove: canRemoveBlock( clientId, rootClientId ),
				canLockBlock: canLockBlockType( getBlockName( clientId ) ),
			};
		},
		[ clientId, checkRoot ]
	);
}
