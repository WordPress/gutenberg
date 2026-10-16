import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';

export default function useBlockOverlayActive( clientId: string ) {
	return useSelect(
		( select ) => {
			const { __unstableHasActiveBlockOverlayActive } =
				select( blockEditorStore );

			return __unstableHasActiveBlockOverlayActive( clientId );
		},
		[ clientId ]
	);
}
