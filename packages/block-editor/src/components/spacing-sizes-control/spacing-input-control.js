/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import {
	Button,
	RangeControl,
	CustomSelectControl,
	__experimentalUnitControl as UnitControl,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import useSetting from '../use-setting';
import {
	LABELS,
	getSliderValueFromPreset,
	getCustomValueFromPreset,
	isValueSpacingPreset,
} from './utils';

export default function SpacingInputControl( {
	spacingSizes,
	value,
	side,
	onChange,
	isMixed = false,
	type,
	minimumCustomValue,
} ) {
	const [ showCustomValueControl, setShowCustomValueControl ] = useState(
		value !== undefined && ! isValueSpacingPreset( value )
	);

	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [ 'px', 'em', 'rem' ],
	} );

	let currentValue;

	if ( isMixed ) {
		currentValue = null;
	} else {
		currentValue = ! showCustomValueControl
			? getSliderValueFromPreset( value, spacingSizes )
			: getCustomValueFromPreset( value, spacingSizes );
	}

	const selectedUnit =
		useMemo(
			() => parseQuantityAndUnitFromRawValue( currentValue ),
			[ currentValue ]
		)[ 1 ] || units[ 0 ].value;

	const setInitialValue = () => {
		if ( value === undefined ) {
			onChange( '0' );
		}
	};

	const customTooltipContent = ( newValue ) =>
		value === undefined ? undefined : spacingSizes[ newValue ]?.name;

	const customRangeValue = parseInt( currentValue, 10 );

	const getNewCustomValue = ( newSize ) => {
		const isNumeric = ! isNaN( parseFloat( newSize ) );
		const nextValue = isNumeric ? newSize : undefined;
		return nextValue;
	};

	const getNewPresetValue = ( newSize, controlType ) => {
		const size = parseInt( newSize, 10 );

		if ( controlType === 'selectList' ) {
			if ( size === 0 ) {
				return undefined;
			}
			if ( size === 1 ) {
				return '0';
			}
		} else if ( size === 0 ) {
			return '0';
		}
		return `var:preset|spacing|${ spacingSizes[ newSize ]?.slug }`;
	};

	const handleCustomValueSliderChange = ( next ) => {
		onChange( [ next, selectedUnit ].join( '' ) );
	};

	const allPlaceholder = isMixed ? __( 'Mixed' ) : null;

	const currentValueHint = ! isMixed
		? customTooltipContent( currentValue )
		: __( 'Mixed' );

	const options = spacingSizes.map( ( size, index ) => ( {
		key: index,
		name: size.name,
	} ) );

	const marks = spacingSizes.map( ( newValue, index ) => ( {
		value: index,
		label: undefined,
	} ) );

	const ariaLabel = sprintf(
		// translators: 1: The side of the block being modified (top, bottom, left, etc.). 2. Type of spacing being modified (Padding, margin, etc)
		__( '%1$s %2$s' ),
		LABELS[ side ],
		type?.toLowerCase()
	);

	const showHint =
		spacingSizes.length <= 9 &&
		! showCustomValueControl &&
		currentValueHint !== undefined;

	return (
		<>
			{ side !== 'all' && (
				<HStack className="components-spacing-sizes-control__side-labels">
					<Text className="components-spacing-sizes-control__side-label">
						{ LABELS[ side ] }
					</Text>

					{ showHint && (
						<Text className="components-spacing-sizes-control__hint-single">
							{ currentValueHint }
						</Text>
					) }
				</HStack>
			) }
			{ side === 'all' && showHint && (
				<Text className="components-spacing-sizes-control__hint-all">
					{ currentValueHint }
				</Text>
			) }

			<Button
				label={
					showCustomValueControl
						? __( 'Use size preset' )
						: __( 'Set custom size' )
				}
				icon={ settings }
				onClick={ () => {
					setShowCustomValueControl( ! showCustomValueControl );
				} }
				isPressed={ showCustomValueControl }
				isSmall
				className={ classnames( {
					'components-spacing-sizes-control__custom-toggle-all':
						side === 'all',
					'components-spacing-sizes-control__custom-toggle-single':
						side !== 'all',
				} ) }
				iconSize={ 24 }
			/>
			{ showCustomValueControl && (
				<>
					<UnitControl
						onChange={ ( newSize ) =>
							onChange( getNewCustomValue( newSize ) )
						}
						value={ currentValue }
						units={ units }
						min={ minimumCustomValue }
						placeholder={ allPlaceholder }
						disableUnits={ isMixed }
						label={ ariaLabel }
						hideLabelFromVision={ true }
						className="components-spacing-sizes-control__custom-value-input"
					/>

					<RangeControl
						value={ customRangeValue }
						min={ 0 }
						max={ 100 }
						withInputField={ false }
						onChange={ handleCustomValueSliderChange }
						className="components-spacing-sizes-control__custom-value-range"
					/>
				</>
			) }
			{ spacingSizes.length <= 9 && ! showCustomValueControl && (
				<RangeControl
					className="components-spacing-sizes-control__range-control"
					value={ currentValue }
					onChange={ ( newSize ) =>
						onChange( getNewPresetValue( newSize ) )
					}
					onMouseDown={ ( event ) => {
						// If mouse down is near start of range set initial value to 0, which
						// prevents the user have to drag right then left to get 0 setting.
						if ( event?.nativeEvent?.offsetX < 35 ) {
							setInitialValue();
						}
					} }
					withInputField={ false }
					aria-valuenow={ currentValue }
					aria-valuetext={ spacingSizes[ currentValue ]?.name }
					renderTooltipContent={ customTooltipContent }
					min={ 0 }
					max={ spacingSizes.length - 1 }
					marks={ marks }
					label={ ariaLabel }
					hideLabelFromVision={ true }
				/>
			) }
			{ spacingSizes.length > 9 && ! showCustomValueControl && (
				<CustomSelectControl
					className="components-spacing-sizes-control__custom-select-control"
					value={
						options.find(
							( option ) => option.key === currentValue
						) || '' // passing undefined here causes a downshift controlled/uncontrolled warning
					}
					onChange={ ( selection ) => {
						onChange(
							getNewPresetValue(
								selection.selectedItem.key,
								'selectList'
							)
						);
					} }
					options={ options }
					label={ ariaLabel }
					hideLabelFromVision={ true }
					__nextUnconstrainedWidth={ true }
				/>
			) }
		</>
	);
}
