/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';

export const PATTERN_TYPES = {
	synced: 'synced',
	unsynced: 'unsynced',
	theme: 'theme',
};
export const SYNC_FILTERS = [
	{ value: 'all', label: __( 'Unfiltered' ) },
	{ value: PATTERN_TYPES.theme, label: __( 'Theme patterns' ) },
	{ value: PATTERN_TYPES.synced, label: __( 'My synced patterns' ) },
	{ value: PATTERN_TYPES.unsynced, label: __( 'My standard patterns' ) },
];

export default function BlockPatternsFilter( { onChange, value } ) {
	return (
		<>
			<SelectControl
				label={ __( 'Filters' ) }
				options={ SYNC_FILTERS }
				value={ value }
				onChange={ onChange }
				aria-label={ __( 'Filter patterns by type' ) }
			/>
		</>
	);
}
