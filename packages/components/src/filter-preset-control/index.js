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
import Button from '../button';
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
	const [ isControlVisible, setIsControlVisible ] = useState( false );
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

	const buttonLabel = isControlVisible ? 'Hide Controls' : 'Show Controls';

	return (
		<div>
			<SelectControl
				label="Preset"
				options={ presets }
				value={ preset }
				onChange={ handleOnPresetChange }
			/>
			<Button
				isTertiary
				isSmall
				onClick={ () => setIsControlVisible( ! isControlVisible ) }
			>
				{ buttonLabel }
			</Button>
			<div style={ { display: isControlVisible ? 'block' : 'none' } }>
				<FilterControl
					{ ...props }
					value={ state }
					onChange={ handleOnFilterChange }
				/>
			</div>
		</div>
	);
}

export default FilterPresetControl;
