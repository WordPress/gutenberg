/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';
import { useState, forwardRef, useEffect } from '@wordpress/element';

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
import type { FontSize, FontSizePickerProps } from './types';
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
import deprecated from '@wordpress/deprecated';

const DEFAULT_UNITS = [ 'px', 'em', 'rem', 'vw', 'vh' ];

type PickerMode = 'predefined' | 'custom' | 'both';
type PickerType = 'select' | 'togglegroup' | 'custom';

const shouldUseSelectOverToggle = ( howManyfontSizes: number ) =>
	howManyfontSizes > 5;

const getPickerType = (
	pickerMode: PickerMode,
	isCustomValue: boolean,
	fontSizes: FontSize[]
): PickerType => {
	if (
		pickerMode === 'custom' ||
		( pickerMode !== 'predefined' && isCustomValue )
	) {
		return 'custom';
	}

	return shouldUseSelectOverToggle( fontSizes.length )
		? 'select'
		: 'togglegroup';
};

const getHeaderHint = (
	currentPickerType: PickerType,
	selectedFontSize: FontSize | undefined,
	fontSizes: FontSize[]
) => {
	if ( currentPickerType === 'custom' ) {
		return __( 'Custom' );
	}

	if ( ! shouldUseSelectOverToggle( fontSizes.length ) ) {
		if ( selectedFontSize ) {
			return (
				selectedFontSize.name ||
				T_SHIRT_NAMES[ fontSizes.indexOf( selectedFontSize ) ]
			);
		}
		return '';
	}

	const commonUnit = getCommonSizeUnit( fontSizes );
	if ( commonUnit ) {
		return `(${ commonUnit })`;
	}

	return '';
};

const UnforwardedFontSizePicker = (
	props: FontSizePickerProps,
	ref: ForwardedRef< any >
) => {
	const {
		__next40pxDefaultSize = false,
		fallbackFontSize,
		fontSizes = [],
		onChange,
		pickerMode = 'both',
		size = 'default',
		units: unitsProp = DEFAULT_UNITS,
		value,
		withSlider = false,
		withReset = true,

		// deprecated
		disableCustomFontSizes,
	} = props;

	let computedPickerMode = pickerMode;
	if ( disableCustomFontSizes !== undefined ) {
		deprecated(
			'`disableCustomFontSizes` prop in wp.components.FontSizePicker',
			{
				since: '6.7',
				version: '6.9',
				alternative: '`pickerMode` prop',
			}
		);

		computedPickerMode = disableCustomFontSizes ? 'predefined' : 'both';
	}

	const selectedFontSize = fontSizes.find(
		( fontSize ) => fontSize.size === value
	);
	const isCustomValue = !! value && ! selectedFontSize;

	const [ currentPickerType, setCurrentPickerType ] = useState<
		'select' | 'togglegroup' | 'custom'
	>( getPickerType( computedPickerMode, isCustomValue, fontSizes ) );

	useEffect( () => {
		setCurrentPickerType(
			getPickerType( computedPickerMode, isCustomValue, fontSizes )
		);
	}, [ computedPickerMode, isCustomValue, fontSizes ] );

	const units = useCustomUnits( {
		availableUnits: unitsProp,
	} );

	if ( fontSizes.length === 0 && computedPickerMode === 'predefined' ) {
		return null;
	}

	const headerHint = getHeaderHint(
		currentPickerType,
		selectedFontSize,
		fontSizes
	);

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
					{ /* Show toggle button only when both picker modes are enabled */ }
					{ computedPickerMode === 'both' && (
						<HeaderToggle
							label={
								currentPickerType === 'custom'
									? __( 'Use size preset' )
									: __( 'Set custom size' )
							}
							icon={ settings }
							onClick={ () => {
								setCurrentPickerType(
									getPickerType(
										currentPickerType === 'custom'
											? 'predefined'
											: 'custom',
										isCustomValue,
										fontSizes
									)
								);
							} }
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
						pickerMode={ computedPickerMode }
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
						onSelectCustom={ () =>
							setCurrentPickerType( 'custom' )
						}
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
									__experimentalIsFocusable
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
