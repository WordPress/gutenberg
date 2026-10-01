import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { __, _x } from '@wordpress/i18n';

type Pattern = {
	type?: string;
	meta?: { wp_pattern_sync_status?: string };
	wp_pattern_sync_status?: string;
};

const SYNC_STATUS_FILTERS = [
	{
		value: 'fully',
		label: _x( 'Synced', 'pattern (singular)' ),
		description: __( 'Patterns that are kept in sync across the site.' ),
	},
	{
		value: 'unsynced',
		label: _x( 'Not synced', 'pattern (singular)' ),
		description: __(
			'Patterns that can be changed freely without affecting the site.'
		),
	},
];

function getPatternSyncStatus( item: Pattern ) {
	if ( item.type && item.type !== 'wp_block' ) {
		return 'unsynced';
	}
	if ( item.meta?.wp_pattern_sync_status === 'unsynced' ) {
		return 'unsynced';
	}
	return item.wp_pattern_sync_status || 'fully';
}

/**
 * The JavaScript parts of the pattern sync status field; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< Pattern >[ string ] = {
	render: ( { item } ) => {
		const syncStatus = getPatternSyncStatus( item );
		const label = SYNC_STATUS_FILTERS.find(
			( { value } ) => value === syncStatus
		)?.label;
		// A plain `span` rather than a `Text`: the grid renders this inside a
		// `Badge`, which is itself a `Text` of the `body-sm` variant, and a
		// nested `Text` would reset the label to the larger default variant.
		return label ? (
			<span
				className={ `fields-field__pattern-sync-status fields-field__pattern-sync-status-${ syncStatus }` }
			>
				{ label }
			</span>
		) : null;
	},
};
