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
			const { __unstableHasActiveBlockOverlayActive } =
				select( blockEditorStore );

			return __unstableHasActiveBlockOverlayActive( clientId );
		},
		[ clientId ]
	);
}
