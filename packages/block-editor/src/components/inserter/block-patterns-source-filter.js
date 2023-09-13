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

const patternSourceOptions = [
	{ value: 'all', label: __( 'All pattern types' ) },
	{ value: PATTERN_TYPES.theme, label: __( 'Theme patterns' ) },
	{ value: PATTERN_TYPES.user, label: __( 'My patterns' ) },
];

export const PATTERN_SOURCE_FILTERS = patternSourceOptions.reduce(
	( patternSourceFilters, { value, label } ) => {
		patternSourceFilters[ value ] = label;
		return patternSourceFilters;
	},
	{}
);

export default function BlockPatternsSourceFilter( { onChange, value } ) {
	return (
		<SelectControl
			className="block-editor-block-patterns__source-filter"
			label={ __( 'Pattern source' ) }
			options={ patternSourceOptions }
			value={ value }
			onChange={ onChange }
			aria-label={ __( 'Filter patterns by type' ) }
			hideLabelFromVision
		/>
	);
}
