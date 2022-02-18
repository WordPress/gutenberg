/**
 * WordPress dependencies
 */
import {
	Button,
	ButtonGroup,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { edit } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

const DEFAULT_WIDTHS = [ '25%', '50%', '75%', '100%' ];
const DEFAULT_UNIT = '%';
const MIN_WIDTH = 0;

/**
 * Determines the CSS unit within the supplied width value.
 *
 * @param {string} value Value including CSS unit.
 * @param {Array}  units Available CSS units to validate against.
 *
 * @return {string} CSS unit extracted from supplied value.
 */
const parseUnit = ( value, units ) => {
	let unit = String( value )
		.trim()
		.match( /[\d.\-\+]*\s*(.*)/ )[ 1 ];

	if ( ! unit ) {
		return DEFAULT_UNIT;
	}

	unit = unit.toLowerCase();
	unit = units.find( ( item ) => item.value === unit );

	return unit?.value || DEFAULT_UNIT;
};

/**
 * Width control that will display as either a simple `UnitControl` or a
 * segmented control containing preset percentage widths. The segmented version
 * contains a toggle to switch to a UnitControl and Slider for explicit control.
 *
 * @param {Object} props Component props.
 * @return {WPElement} Width control.
 */
export default function WidthControl( props ) {
	const {
		label = __( 'Width' ),
		onChange,
		units,
		value,
		isSegmentedControl = false,
		min = MIN_WIDTH,
		presetWidths = DEFAULT_WIDTHS,
	} = props;

	const ref = useRef();
	const hasCustomValue = value && ! presetWidths.includes( value );
	const [ customView, setCustomView ] = useState( hasCustomValue );
	const currentUnit = parseUnit( value, units );

	// When switching to the custom view, move focus to the UnitControl.
	useEffect( () => {
		if ( customView && ref.current ) {
			ref.current.focus();
		}
	}, [ customView ] );

	// Unless segmented control is desired return a normal UnitControl.
	if ( ! isSegmentedControl ) {
		return (
			<UnitControl
				label={ label }
				min={ min }
				unit={ currentUnit }
				{ ...props }
			/>
		);
	}

	const toggleCustomView = () => {
		setCustomView( ! customView );
	};

	const handlePresetChange = ( selectedValue ) => {
		const newWidth = selectedValue === value ? undefined : selectedValue;
		onChange( newWidth );
	};

	const renderCustomView = () => (
		<UnitControl
			ref={ ref }
			min={ min }
			unit={ currentUnit }
			{ ...props }
		/>
	);

	const renderPresetView = () => (
		<ButtonGroup aria-label={ __( 'Button width' ) }>
			{ presetWidths.map( ( width ) => (
				<Button
					key={ width }
					isSmall
					variant={ value === width ? 'primary' : undefined }
					onClick={ () => handlePresetChange( width ) }
				>
					{ width }
				</Button>
			) ) }
		</ButtonGroup>
	);

	return (
		<fieldset className="components-width-control is-segmented">
			<legend>{ label }</legend>
			<div className="components-width-control__wrapper">
				{ customView ? renderCustomView() : renderPresetView() }
				<Button
					icon={ edit }
					isSmall
					isPressed={ customView }
					onClick={ toggleCustomView }
				/>
			</div>
		</fieldset>
	);
}
