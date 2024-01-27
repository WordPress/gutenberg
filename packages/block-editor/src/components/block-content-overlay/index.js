/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

// Note: this selector no longer seems to be used anywhere. Deprecate?
export default function useBlockOverlayActive( clientId ) {
	return useSelect(
		( select ) => {
			const { __unstableHasActiveBlockOverlayActive } =
				select( blockEditorStore );

			return __unstableHasActiveBlockOverlayActive( clientId );
		},
		[ clientId ]
	);
}
