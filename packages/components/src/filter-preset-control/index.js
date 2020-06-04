/**
 * External dependencies
 */
import { noop } from 'lodash';
/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FilterControl from '../filter-control';
import SelectControl from '../select-control';

const { createStyles } = FilterControl;

const presets = [
	{
		label: 'None',
		value: 'none',
		filters: undefined,
	},
	{
		label: 'Vivid',
		value: 'vivid',
		filters: {
			contrast: 110,
			saturate: 105,
		},
	},
	{
		label: 'Mono',
		value: 'mono',
		filters: {
			saturate: 0,
		},
	},
	{
		label: 'Noir',
		value: 'noir',
		filters: {
			contrast: 110,
			saturate: 0,
		},
	},
	{
		label: 'Custom',
		value: 'custom',
		filters: {},
	},
];

function FilterPresetControl( { onChange = noop, value, ...props } ) {
	const [ __state, setState ] = useState( value || {} );
	const [ preset, setPreset ] = useState( 'none' );
	const state = value || __state;

	const getPreset = ( val ) => {
		return presets.find( ( p ) => p.value === val );
	};

	const handleOnPresetChange = ( next ) => {
		const nextPreset = getPreset( next );
		handleOnFilterChange( nextPreset.filters );
		setPreset( next );
	};

	const handleOnFilterChange = ( next ) => {
		const styles = createStyles( next );

		setState( next );
		onChange( next, { styles } );

		if ( ! value ) {
			setState( next );
		}
	};

	return (
		<div>
			<SelectControl
				label="Preset"
				options={ presets }
				value={ preset }
				onChange={ handleOnPresetChange }
			/>
			<FilterControl
				{ ...props }
				value={ state }
				onChange={ handleOnFilterChange }
			/>
		</div>
	);
}

export default FilterPresetControl;
