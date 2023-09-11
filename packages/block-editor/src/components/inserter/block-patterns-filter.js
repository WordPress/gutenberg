/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';

export const PATTERN_TYPES = {
	synced: 'synced',
	unsynced: 'unsynced',
	user: 'user',
	theme: 'theme',
};
export const PATTERN_FILTERS = [
	{ value: 'all', label: __( 'Unfiltered' ) },
	{ value: PATTERN_TYPES.theme, label: __( 'Theme patterns' ) },
	{ value: PATTERN_TYPES.user, label: __( 'My patterns' ) },
];

export default function BlockPatternsFilter( { onChange, value } ) {
	return (
		<SelectControl
			label={ __( 'Filters' ) }
			options={ PATTERN_FILTERS }
			value={ value }
			onChange={ onChange }
			aria-label={ __( 'Filter patterns by type' ) }
		/>
	);
}
