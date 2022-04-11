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
 * @param {string}  clientId  The block client Id.
 * @param {boolean} checkRoot Optional. Use root client ID when checking lock status.
 *
 * @return {Object} Block lock status
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
				canLock: canLockBlockType( getBlockName( clientId ) ),
			};
		},
		[ clientId, checkRoot ]
	);
}
