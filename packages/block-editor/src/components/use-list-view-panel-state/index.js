/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Custom hook for managing List View panel state.
 *
 * @param {string} clientId Block client ID.
 * @return {Object} Panel state and handlers.
 */
export default function useListViewPanelState( clientId ) {
	const { isOpened, expandRevision } = useSelect(
		( select ) => {
			const {
				__unstableIsListViewPanelOpened,
				__unstableGetListViewExpandRevision,
			} = select( blockEditorStore );
			return {
				isOpened: __unstableIsListViewPanelOpened( clientId ),
				expandRevision: __unstableGetListViewExpandRevision(),
			};
		},
		[ clientId ]
	);

	const { __unstableToggleListViewPanel: toggleListViewPanel } =
		useDispatch( blockEditorStore );

	const handleToggle = ( opened ) => {
		toggleListViewPanel( clientId, opened );
	};

	return {
		isOpened,
		expandRevision,
		handleToggle,
	};
}
