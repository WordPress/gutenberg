/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { TAB_LIST_VIEW } from './utils';

const SETTINGS_KEY = 'lastSelectedInspectorControlTab';

export default function useLastSelectedInspectorControlTab( tabs ) {
	const lastTab = useSelect( ( select ) => {
		const settings = select( blockEditorStore ).getSettings();
		return settings[ SETTINGS_KEY ];
	} );

	const { updateSettings } = useDispatch( blockEditorStore );

	const setLastSelectedTab = useCallback(
		( tabName ) => {
			if ( TAB_LIST_VIEW.name === tabName ) {
				return;
			}
			updateSettings( {
				[ SETTINGS_KEY ]: tabName,
			} );
		},
		[ updateSettings ]
	);

	const selectedBlockHasTab = !! tabs?.find(
		( { name } ) => lastTab === name
	);

	return [ selectedBlockHasTab ? lastTab : undefined, setLastSelectedTab ];
}
