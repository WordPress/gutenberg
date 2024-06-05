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
import FontSizePickerCustomControl, {
	DEFAULT_UNITS,
} from './font-size-picker-custom-control';
import { T_SHIRT_NAMES } from './constants';

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
		units = DEFAULT_UNITS,
		value,
		withSlider = false,
		withReset = true,
	} = props;

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
							size="small"
						/>
					) }
				</Header>
			</Spacer>
			<div>
				{ !! fontSizes.length &&
					shouldUseSelectControl &&
					! showCustomValueControl && (
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
				{ ! disableCustomFontSizes && showCustomValueControl && (
					<FontSizePickerCustomControl
						__next40pxDefaultSize={ __next40pxDefaultSize }
						value={ value }
						isDisabled={ isDisabled }
						hasUnits={ hasUnits }
						units={ units }
						withSlider={ withSlider }
						withReset={ withReset }
						fallbackFontSize={ fallbackFontSize }
						onChange={ onChange }
					/>
				) }
			</div>
		</Container>
	);
};

export const FontSizePicker = forwardRef( UnforwardedFontSizePicker );

export default FontSizePicker;
