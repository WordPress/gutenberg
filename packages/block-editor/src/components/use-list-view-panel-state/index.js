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
 * Returns the panel's open/closed state and a counter (expandRevision) used to force
 * ListView remounting. The expandRevision is included in the ListView component's key
 * prop. When it changes, the component will remount with fresh isExpanded=true state.
 *
 * @param {string} clientId Block client ID.
 * @return {Object} Panel state and handlers with isOpened (boolean), expandRevision (number), and handleToggle (function).
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
