/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';
import { useState, useMemo, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from '../button';
import RangeControl from '../range-control';
import { Flex, FlexItem } from '../flex';
import {
	default as UnitControl,
	parseQuantityAndUnitFromRawValue,
	useCustomUnits,
} from '../unit-control';
import { VisuallyHidden } from '../visually-hidden';
import { getCommonSizeUnit } from './utils';
import type { FontSizePickerProps } from './types';
import {
	Container,
	Header,
	HeaderHint,
	HeaderLabel,
	HeaderToggle,
} from './styles';
import { Spacer } from '../spacer';
import FontSizePickerSelect from './font-size-picker-select';
import FontSizePickerToggleGroup from './font-size-picker-toggle-group';
import { T_SHIRT_NAMES } from './constants';

const DEFAULT_UNITS = [ 'px', 'em', 'rem', 'vw', 'vh' ];

const MAX_TOGGLE_GROUP_SIZES = 5;

const UnforwardedFontSizePicker = (
	props: FontSizePickerProps,
	ref: ForwardedRef< any >
) => {
	const {
		__next40pxDefaultSize = false,
		fallbackFontSize,
		fontSizes = [],
		disableCustomFontSizes = false,
		onChange,
		size = 'default',
		units: unitsProp = DEFAULT_UNITS,
		value,
		withSlider = false,
		withReset = true,
	} = props;

	const units = useCustomUnits( {
		availableUnits: unitsProp,
	} );

	const selectedFontSize = fontSizes.find(
		( fontSize ) => fontSize.size === value
	);
	const isCustomValue = !! value && ! selectedFontSize;

	// Initially request a custom picker if the value is not from the predef list.
	const [ userRequestedCustom, setUserRequestedCustom ] =
		useState( isCustomValue );

	let currentPickerType;
	if ( ! disableCustomFontSizes && userRequestedCustom ) {
		// While showing the custom value picker, switch back to predef only if
		// `disableCustomFontSizes` is set to `true`.
		currentPickerType = 'custom' as const;
	} else {
		currentPickerType =
			fontSizes.length > MAX_TOGGLE_GROUP_SIZES
				? ( 'select' as const )
				: ( 'togglegroup' as const );
	}

	const headerHint = useMemo( () => {
		switch ( currentPickerType ) {
			case 'custom':
				return __( 'Custom' );
			case 'togglegroup':
				if ( selectedFontSize ) {
					return (
						selectedFontSize.name ||
						T_SHIRT_NAMES[ fontSizes.indexOf( selectedFontSize ) ]
					);
				}
				break;
			case 'select':
				const commonUnit = getCommonSizeUnit( fontSizes );
				if ( commonUnit ) {
					return `(${ commonUnit })`;
				}
				break;
		}

		return '';
	}, [ currentPickerType, selectedFontSize, fontSizes ] );

	if ( fontSizes.length === 0 && disableCustomFontSizes ) {
		return null;
	}

	// If neither the value or first font size is a string, then FontSizePicker
	// operates in a legacy "unitless" mode where UnitControl can only be used
	// to select px values and onChange() is always called with number values.
	const hasUnits =
		typeof value === 'string' || typeof fontSizes[ 0 ]?.size === 'string';

	const [ valueQuantity, valueUnit ] = parseQuantityAndUnitFromRawValue(
		value,
		units
	);
	const isValueUnitRelative =
		!! valueUnit && [ 'em', 'rem', 'vw', 'vh' ].includes( valueUnit );
	const isDisabled = value === undefined;

	return (
		<Container ref={ ref } className="components-font-size-picker">
			<VisuallyHidden as="legend">{ __( 'Font size' ) }</VisuallyHidden>
			<Spacer>
				<Header className="components-font-size-picker__header">
					<HeaderLabel
						aria-label={ `${ __( 'Size' ) } ${ headerHint || '' }` }
					>
						{ __( 'Size' ) }
						{ headerHint && (
							<HeaderHint className="components-font-size-picker__header__hint">
								{ headerHint }
							</HeaderHint>
						) }
					</HeaderLabel>
					{ ! disableCustomFontSizes && (
						<HeaderToggle
							label={
								currentPickerType === 'custom'
									? __( 'Use size preset' )
									: __( 'Set custom size' )
							}
							icon={ settings }
							onClick={ () =>
								setUserRequestedCustom( ! userRequestedCustom )
							}
							isPressed={ currentPickerType === 'custom' }
							size="small"
						/>
					) }
				</Header>
			</Spacer>
			<div>
				{ currentPickerType === 'select' && (
					<FontSizePickerSelect
						__next40pxDefaultSize={ __next40pxDefaultSize }
						fontSizes={ fontSizes }
						value={ value }
						disableCustomFontSizes={ disableCustomFontSizes }
						size={ size }
						onChange={ ( newValue ) => {
							if ( newValue === undefined ) {
								onChange?.( undefined );
							} else {
								onChange?.(
									hasUnits ? newValue : Number( newValue ),
									fontSizes.find(
										( fontSize ) =>
											fontSize.size === newValue
									)
								);
							}
						} }
						onSelectCustom={ () => setUserRequestedCustom( true ) }
					/>
				) }
				{ currentPickerType === 'togglegroup' && (
					<FontSizePickerToggleGroup
						fontSizes={ fontSizes }
						value={ value }
						__next40pxDefaultSize={ __next40pxDefaultSize }
						size={ size }
						onChange={ ( newValue ) => {
							if ( newValue === undefined ) {
								onChange?.( undefined );
							} else {
								onChange?.(
									hasUnits ? newValue : Number( newValue ),
									fontSizes.find(
										( fontSize ) =>
											fontSize.size === newValue
									)
								);
							}
						} }
					/>
				) }
				{ currentPickerType === 'custom' && (
					<Flex className="components-font-size-picker__custom-size-control">
						<FlexItem isBlock>
							<UnitControl
								__next40pxDefaultSize={ __next40pxDefaultSize }
								label={ __( 'Custom' ) }
								labelPosition="top"
								hideLabelFromVision
								value={ value }
								onChange={ ( newValue ) => {
									setUserRequestedCustom( true );

									if ( newValue === undefined ) {
										onChange?.( undefined );
									} else {
										onChange?.(
											hasUnits
												? newValue
												: parseInt( newValue, 10 )
										);
									}
								} }
								size={ size }
								units={ hasUnits ? units : [] }
								min={ 0 }
							/>
						</FlexItem>
						{ withSlider && (
							<FlexItem isBlock>
								<Spacer marginX={ 2 } marginBottom={ 0 }>
									<RangeControl
										__nextHasNoMarginBottom
										__next40pxDefaultSize={
											__next40pxDefaultSize
										}
										className="components-font-size-picker__custom-input"
										label={ __( 'Custom Size' ) }
										hideLabelFromVision
										value={ valueQuantity }
										initialPosition={ fallbackFontSize }
										withInputField={ false }
										onChange={ ( newValue ) => {
											setUserRequestedCustom( true );

											if ( newValue === undefined ) {
												onChange?.( undefined );
											} else if ( hasUnits ) {
												onChange?.(
													newValue +
														( valueUnit ?? 'px' )
												);
											} else {
												onChange?.( newValue );
											}
										} }
										min={ 0 }
										max={ isValueUnitRelative ? 10 : 100 }
										step={ isValueUnitRelative ? 0.1 : 1 }
									/>
								</Spacer>
							</FlexItem>
						) }
						{ withReset && (
							<FlexItem>
								<Button
									disabled={ isDisabled }
									accessibleWhenDisabled
									onClick={ () => {
										onChange?.( undefined );
									} }
									variant="secondary"
									__next40pxDefaultSize
									size={
										size === '__unstable-large' ||
										props.__next40pxDefaultSize
											? 'default'
											: 'small'
									}
								>
									{ __( 'Reset' ) }
								</Button>
							</FlexItem>
						) }
					</Flex>
				) }
			</div>
		</Container>
	);
};

export const FontSizePicker = forwardRef( UnforwardedFontSizePicker );

export default FontSizePicker;
