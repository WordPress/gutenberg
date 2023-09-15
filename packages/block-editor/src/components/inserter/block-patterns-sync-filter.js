/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
export const SYNC_TYPES = {
	full: 'fully',
	unsynced: 'unsynced',
};

const patternSyncOptions = [
	{ value: 'all', label: __( 'All' ) },
	{ value: SYNC_TYPES.full, label: __( 'Synced' ) },
	{ value: SYNC_TYPES.unsynced, label: __( 'Standard' ) },
];

export function BlockPatternsSyncFilter( {
	setPatternSyncFilter,
	patternSyncFilter,
} ) {
	return (
		<SelectControl
			className="block-editor-patterns__sync-status-filter"
			label={ __( 'Syncing' ) }
			options={ patternSyncOptions }
			value={ patternSyncFilter }
			onChange={ setPatternSyncFilter }
			aria-label={ __( 'Filter patterns by sync type' ) }
		/>
	);
}
