/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
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

const SYNC_FILTERS = {
	all: __( 'All' ),
	[ SYNC_TYPES.full ]: __( 'Synced' ),
	[ SYNC_TYPES.unsynced ]: __( 'Standard' ),
};

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
		<ToggleGroupControl
			className="block-editor-patterns__sync-status-filter"
			hideLabelFromVision
			label={ __( 'Filter by sync status' ) }
			value={ syncFilter }
			isBlock
			onChange={ ( value ) => handleUpdateSyncFilter( value ) }
			__nextHasNoMarginBottom
		>
			{ Object.entries( SYNC_FILTERS ).map( ( [ key, syncLabel ] ) => (
				<ToggleGroupControlOption
					className="block-editor-patterns__sync-status-filter-option"
					key={ key }
					value={ key }
					label={ syncLabel }
				/>
			) ) }
		</ToggleGroupControl>
	);
}
