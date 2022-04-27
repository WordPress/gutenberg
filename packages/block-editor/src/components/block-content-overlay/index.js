/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function useBlockOverlayActive( clientId ) {
	const { isParentSelected, hasChildSelected } = useSelect(
		( select ) => {
			const { isBlockSelected, hasSelectedInnerBlock } = select(
				blockEditorStore
			);
			return {
				isParentSelected: isBlockSelected( clientId ),
				hasChildSelected: hasSelectedInnerBlock( clientId, true ),
			};
		},
		[ clientId ]
	);

	return ! isParentSelected && ! hasChildSelected;
}
