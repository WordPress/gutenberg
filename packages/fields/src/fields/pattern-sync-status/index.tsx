/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __, _x } from '@wordpress/i18n';
// @ts-ignore
import { privateApis as patternPrivateApis } from '@wordpress/patterns';

/**
 * Internal dependencies
 */
import type { Pattern } from '../../types';
import { unlock } from '../../lock-unlock';

const { PATTERN_SYNC_TYPES } = unlock( patternPrivateApis );

function getPatternSyncStatus( item: Pattern ) {
	// When the post is first created, the top-level sync status is not set yet,
	// so fall back to the meta value.
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
	type: 'text',
	label: __( 'Sync status' ),
	readOnly: true,
	enableSorting: false,
	enableHiding: false,
	filterBy: false,
	render: ( { item } ) => (
		<span>
			{ getPatternSyncStatusLabel( getPatternSyncStatus( item ) ) }
		</span>
	),
};

/**
 * Sync status field for patterns.
 */
export default patternSyncStatusField;
