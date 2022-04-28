/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function useBlockOverlayActive( clientId ) {
	return useSelect(
		( select ) => {
			const {
				isBlockSelected,
				hasSelectedInnerBlock,
				canEditBlock,
			} = select( blockEditorStore );

			return (
				! canEditBlock( clientId ) ||
				( ! isBlockSelected( clientId ) &&
					! hasSelectedInnerBlock( clientId, true ) )
			);
		},
		[ clientId ]
	);
}
