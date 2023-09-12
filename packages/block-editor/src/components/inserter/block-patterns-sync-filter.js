/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
export const SYNC_TYPES = {
	full: 'fully',
	unsynced: 'unsynced',
};

const patternSyncOptions = [
	{ value: 'all', label: __( 'All' ) },
	{ value: SYNC_TYPES.full, label: __( 'Synced' ) },
	{ value: SYNC_TYPES.unsynced, label: __( 'Standard' ) },
];

export function BlockPatternsSyncFilter() {
	const { updateSettings } = useDispatch( blockEditorStore );

	const syncFilter = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const settings = getSettings();
		return settings.patternsSyncFilter || 'all';
	}, [] );

	const handleUpdateSyncFilter = ( value ) => {
		updateSettings( {
			patternsSyncFilter: value,
		} );
	};

	return (
		<SelectControl
			className="block-editor-patterns__sync-status-filter"
			label={ __( 'Syncing' ) }
			options={ patternSyncOptions }
			value={ syncFilter }
			onChange={ ( value ) => handleUpdateSyncFilter( value ) }
			aria-label={ __( 'Filter patterns by sync type' ) }
		/>
	);
}
