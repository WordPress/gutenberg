/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Custom hook for managing List View panel state.
 *
 * @param {string} clientId Block client ID.
 * @return {Object} Panel state and handlers.
 */
export default function useListViewPanelState( clientId ) {
	const { isOpened, expandRevision } = useSelect(
		( select ) => {
			const { isListViewPanelOpened, getListViewExpandRevision } = unlock(
				select( blockEditorStore )
			);
			return {
				isOpened: isListViewPanelOpened( clientId ),
				expandRevision: getListViewExpandRevision(),
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
