/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { __ } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';
import { useState, useMemo, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import RangeControl from '../range-control';
import { Flex, FlexItem } from '../flex';
import {
	default as UnitControl,
	parseQuantityAndUnitFromRawValue,
	useCustomUnits,
} from '../unit-control';
import { VisuallyHidden } from '../visually-hidden';
import { getCommonSizeUnit } from './utils';
import { HStack } from '../h-stack';
import type { FontSizePickerProps } from './types';
import {
	Container,
	HeaderHint,
	HeaderLabel,
	Controls,
	ResetButton,
} from './styles';
import { Spacer } from '../spacer';
import FontSizePickerSelect from './font-size-picker-select';
import FontSizePickerToggleGroup from './font-size-picker-toggle-group';
import { T_SHIRT_NAMES } from './constants';

const UnforwardedFontSizePicker = (
	props: FontSizePickerProps,
	ref: ForwardedRef< any >
) => {
	const {
		/** Start opting into the new margin-free styles that will become the default in a future version. */
		__nextHasNoMarginBottom = false,
		fallbackFontSize,
		fontSizes = [],
		disableCustomFontSizes = false,
		onChange,
		size = 'default',
		units: unitsProp,
		value,
		withSlider = false,
		withReset = true,
	} = props;

	if ( ! __nextHasNoMarginBottom ) {
		deprecated( 'Bottom margin styles for wp.components.FontSizePicker', {
			since: '6.1',
			version: '6.4',
			hint: 'Set the `__nextHasNoMarginBottom` prop to true to start opting into the new styles, which will become the default in a future version.',
		} );
	}

	const units = useCustomUnits( {
		availableUnits: unitsProp || [ 'px', 'em', 'rem' ],
	} );

	const shouldUseSelectControl = fontSizes.length > 5;
	const selectedFontSize = fontSizes.find(
		( fontSize ) => fontSize.size === value
	);
	const isCustomValue = !! value && ! selectedFontSize;

	const [ showCustomValueControl, setShowCustomValueControl ] = useState(
		! disableCustomFontSizes && isCustomValue
	);

	const headerHint = useMemo( () => {
		if ( showCustomValueControl ) {
			return __( 'Custom' );
		}

		if ( ! shouldUseSelectControl ) {
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
	}, [
		showCustomValueControl,
		shouldUseSelectControl,
		selectedFontSize,
		fontSizes,
	] );

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
		!! valueUnit && [ 'em', 'rem' ].includes( valueUnit );

	return (
		<Container ref={ ref } className="components-font-size-picker">
			<VisuallyHidden as="legend">{ __( 'Font size' ) }</VisuallyHidden>
			<Spacer>
				<HStack className="components-font-size-picker__header">
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
						<Button
							label={
								showCustomValueControl
									? __( 'Use size preset' )
									: __( 'Set custom size' )
							}
							icon={ settings }
							onClick={ () => {
								setShowCustomValueControl(
									! showCustomValueControl
								);
							} }
							isPressed={ showCustomValueControl }
							isSmall
						/>
					) }
				</HStack>
			</Spacer>
			<Controls
				className="components-font-size-picker__controls"
				__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
			>
				{ !! fontSizes.length &&
					shouldUseSelectControl &&
					! showCustomValueControl && (
						<FontSizePickerSelect
							fontSizes={ fontSizes }
							value={ value }
							disableCustomFontSizes={ disableCustomFontSizes }
							size={ size }
							onChange={ ( newValue ) => {
								if ( newValue === undefined ) {
									onChange?.( undefined );
								} else {
									onChange?.(
										hasUnits
											? newValue
											: Number( newValue ),
										fontSizes.find(
											( fontSize ) =>
												fontSize.size === newValue
										)
									);
								}
							} }
							onSelectCustom={ () =>
								setShowCustomValueControl( true )
							}
						/>
					) }
				{ ! shouldUseSelectControl && ! showCustomValueControl && (
					<FontSizePickerToggleGroup
						fontSizes={ fontSizes }
						value={ value }
						__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
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
				{ ! disableCustomFontSizes && showCustomValueControl && (
					<Flex className="components-font-size-picker__custom-size-control">
						<FlexItem isBlock>
							<UnitControl
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
										__nextHasNoMarginBottom={
											__nextHasNoMarginBottom
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
								<ResetButton
									disabled={ value === undefined }
									onClick={ () => {
										onChange?.( undefined );
									} }
									isSmall
									variant="secondary"
									size={ size }
								>
									{ __( 'Reset' ) }
								</ResetButton>
							</FlexItem>
						) }
					</Flex>
				) }
			</Controls>
		</Container>
	);
};

export const FontSizePicker = forwardRef( UnforwardedFontSizePicker );

export default FontSizePicker;
