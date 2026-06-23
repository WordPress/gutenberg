/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __, _x } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { Pattern } from '../../types';

const PATTERN_SYNC_TYPES = {
	full: 'fully',
	unsynced: 'unsynced',
};

function getPatternSyncStatus( item: Pattern ) {
	if ( item.meta?.wp_pattern_sync_status === PATTERN_SYNC_TYPES.unsynced ) {
		return PATTERN_SYNC_TYPES.unsynced;
	}
	return item.wp_pattern_sync_status || PATTERN_SYNC_TYPES.full;
}

function getPatternSyncStatusLabel( syncStatus: string ) {
	return syncStatus === PATTERN_SYNC_TYPES.unsynced
		? _x( 'Not synced', 'pattern (singular)' )
		: _x( 'Synced', 'pattern (singular)' );
}

const patternSyncStatusField: Field< Pattern > = {
	id: 'sync-status',
	label: __( 'Sync status' ),
	readOnly: true,
	enableSorting: false,
	enableHiding: false,
	filterBy: false,
	render: ( { item } ) => (
		<Text>
			{ getPatternSyncStatusLabel( getPatternSyncStatus( item ) ) }
		</Text>
	),
};

/**
 * Sync status field for patterns.
 */
export default patternSyncStatusField;
