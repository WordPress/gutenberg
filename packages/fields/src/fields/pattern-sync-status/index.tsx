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

const { PATTERN_SYNC_TYPES, PATTERN_TYPES } = unlock( patternPrivateApis );

const SYNC_STATUS_FILTERS = [
	{
		value: PATTERN_SYNC_TYPES.full,
		label: _x( 'Synced', 'pattern (singular)' ),
		description: __( 'Patterns that are kept in sync across the site.' ),
	},
	{
		value: PATTERN_SYNC_TYPES.unsynced,
		label: _x( 'Not synced', 'pattern (singular)' ),
		description: __(
			'Patterns that can be changed freely without affecting the site.'
		),
	},
];

function getPatternSyncStatus( item: Pattern ) {
	if ( item.type && item.type !== PATTERN_TYPES.user ) {
		return PATTERN_SYNC_TYPES.unsynced;
	}
	// When a pattern is first created directly from the post editor
	// (`post-new.php?post_type=wp_block`), the top-level sync status is not
	// set yet, so fall back to the meta value.
	if ( item.meta?.wp_pattern_sync_status === PATTERN_SYNC_TYPES.unsynced ) {
		return PATTERN_SYNC_TYPES.unsynced;
	}
	return item.wp_pattern_sync_status || PATTERN_SYNC_TYPES.full;
}

const patternSyncStatusField: Field< Pattern > = {
	id: 'sync-status',
	type: 'text',
	label: __( 'Sync status' ),
	readOnly: true,
	enableSorting: false,
	enableHiding: true,
	elements: SYNC_STATUS_FILTERS,
	filterBy: {
		operators: [ 'is' ],
		isPrimary: true,
	},
	render: ( { item } ) => {
		const syncStatus = getPatternSyncStatus( item );
		return (
			<span
				className={ `fields-field__pattern-sync-status fields-field__pattern-sync-status-${ syncStatus }` }
			>
				{
					SYNC_STATUS_FILTERS.find(
						( { value } ) => value === syncStatus
					)?.label
				}
			</span>
		);
	},
};

/**
 * Sync status field for patterns.
 */
export default patternSyncStatusField;
