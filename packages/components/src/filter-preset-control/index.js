/**
 * External dependencies
 */
import { noop } from 'lodash';
import {
	useDisclosureState,
	Disclosure,
	DisclosureContent,
} from 'reakit/Disclosure';

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
import {
	Root,
	SelectControlWrapper,
	ControlWrapper,
} from './styles/filter-preset-control-styles';
import { useControlledState } from '../utils/hooks';

const { createStyles } = FilterControl;

const presets = [
	{
		label: 'None',
		value: 'none',
		filters: {},
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

function FilterPresetControl( {
	onChange = noop,
	value,
	preset: presetProp = 'none',
	showControls = false,
	...props
} ) {
	const [ controlledState, setControlledState ] = useControlledState( value );
	const [ preset, setPreset ] = useState( presetProp );
	const disclosure = useDisclosureState( { visible: showControls } );

	const getPreset = ( val ) => {
		return presets.find( ( p ) => p.value === val );
	};

	const handleOnPresetChange = ( next ) => {
		const nextPreset = getPreset( next );
		handleOnFilterChange( nextPreset.filters );
		setPreset( next );

		if ( next === 'none' ) {
			disclosure.setVisible( false );
		}

		if ( next === 'custom' ) {
			disclosure.setVisible( true );
		}
	};

	const handleOnFilterChange = ( next ) => {
		const styles = createStyles( next );

		setControlledState( next );
		onChange( next, { styles } );

		if ( preset !== 'custom' ) {
			setPreset( 'custom' );
		}

		if ( ! value ) {
			setControlledState( next );
		}
	};

	const buttonLabel = disclosure.visible ? 'Hide Controls' : 'Show Controls';

	return (
		<Root>
			<SelectControlWrapper>
				<SelectControl
					className="hello"
					label="Preset"
					options={ presets }
					value={ preset }
					onChange={ handleOnPresetChange }
				/>
			</SelectControlWrapper>
			<Disclosure { ...disclosure } as={ Button } isTertiary isSmall>
				{ buttonLabel }
			</Disclosure>
			<DisclosureContent { ...disclosure } as={ ControlWrapper }>
				<FilterControl
					{ ...props }
					value={ controlledState }
					onChange={ handleOnFilterChange }
				/>
			</DisclosureContent>
		</Root>
	);
}

export default FilterPresetControl;
