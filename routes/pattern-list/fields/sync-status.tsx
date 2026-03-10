/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { privateApis as patternPrivateApis } from '@wordpress/patterns';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import type { NormalizedPattern } from '../use-patterns';

const { PATTERN_SYNC_TYPES } = unlock( patternPrivateApis );

const OPERATOR_IS = 'is';

const SYNC_FILTERS = [
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

export const patternStatusField = {
	label: __( 'Sync status' ),
	id: 'sync-status',
	render: ( { item }: { item: NormalizedPattern } ) => {
		const syncStatus = item.syncStatus;
		return (
			<span
				className={ `routes-pattern-list__field-sync-status-${ syncStatus }` }
			>
				{
					SYNC_FILTERS.find( ( { value } ) => value === syncStatus )
						?.label
				}
			</span>
		);
	},
	elements: SYNC_FILTERS,
	filterBy: {
		operators: [ OPERATOR_IS ],
		isPrimary: true,
	},
	enableSorting: false,
};
