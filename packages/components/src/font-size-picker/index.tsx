/**
 * External dependencies
 */
import classNames from 'classnames';
import type { ReactNode, ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { __, sprintf } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';
import { useState, useMemo, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { BaseControl } from '../base-control';
import Button from '../button';
import RangeControl from '../range-control';
import { Flex, FlexItem } from '../flex';
import { default as UnitControl, useCustomUnits } from '../unit-control';
import CustomSelectControl from '../custom-select-control';
import { VisuallyHidden } from '../visually-hidden';
import {
	ToggleGroupControl,
	ToggleGroupControlOption,
} from '../toggle-group-control';
import {
	getFontSizeOptions,
	getSelectedOption,
	splitValueAndUnitFromSize,
	isSimpleCssValue,
	CUSTOM_FONT_SIZE,
} from './utils';
import { VStack } from '../v-stack';
import { HStack } from '../h-stack';
import type {
	FontSizePickerProps,
	FontSizeSelectOption,
	FontSizeToggleGroupOption,
} from './types';

// This conditional is needed to maintain the spacing before the slider in the `withSlider` case.
const MaybeVStack = ( {
	__nextHasNoMarginBottom,
	children,
}: {
	__nextHasNoMarginBottom: boolean;
	children: ReactNode;
} ) =>
	! __nextHasNoMarginBottom ? (
		<>{ children }</>
	) : (
		<VStack spacing={ 6 } children={ children } />
	);

function FontSizePicker(
	props: FontSizePickerProps,
	ref: ForwardedRef< any >
) {
	const {
		/** Start opting into the new margin-free styles that will become the default in a future version. */
		__nextHasNoMarginBottom = false,
		fallbackFontSize,
		fontSizes = [],
		disableCustomFontSizes = false,
		onChange = () => {},
		size = 'default',
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

	const hasUnits = [ typeof value, typeof fontSizes?.[ 0 ]?.size ].includes(
		'string'
	);
	const noUnitsValue = ! hasUnits ? value : parseInt( String( value ) );
	const isPixelValue = typeof value === 'number' || value?.endsWith?.( 'px' );
	const units = useCustomUnits( {
		availableUnits: [ 'px', 'em', 'rem' ],
	} );

	/**
	 * The main font size UI displays a toggle group when the presets are less
	 * than six and a select control when they are more.
	 */
	const fontSizesContainComplexValues = fontSizes.some(
		( { size: sizeArg } ) => ! isSimpleCssValue( sizeArg )
	);
	const shouldUseSelectControl = fontSizes.length > 5;
	const options = useMemo(
		() =>
			getFontSizeOptions(
				shouldUseSelectControl,
				fontSizes,
				disableCustomFontSizes
			),
		[ shouldUseSelectControl, fontSizes, disableCustomFontSizes ]
	);
	const selectedOption = getSelectedOption( fontSizes, value );
	const isCustomValue = selectedOption.slug === CUSTOM_FONT_SIZE;
	const [ showCustomValueControl, setShowCustomValueControl ] = useState(
		! disableCustomFontSizes && isCustomValue
	);
	const headerHint = useMemo( () => {
		if ( showCustomValueControl ) {
			return `(${ __( 'Custom' ) })`;
		}

		// If we have a custom value that is not available in the font sizes,
		// show it as a hint as long as it's a simple CSS value.
		if ( isCustomValue ) {
			return (
				value !== undefined &&
				isSimpleCssValue( value ) &&
				`(${ value })`
			);
		}
		if ( shouldUseSelectControl ) {
			return (
				selectedOption?.size !== undefined &&
				isSimpleCssValue( selectedOption?.size ) &&
				`(${ selectedOption?.size })`
			);
		}

		// Calculate the `hint` for toggle group control.
		let hint = selectedOption.name;
		if (
			! fontSizesContainComplexValues &&
			typeof selectedOption.size === 'string'
		) {
			const [ , unit ] = splitValueAndUnitFromSize( selectedOption.size );
			hint += `(${ unit })`;
		}
		return hint;
	}, [
		showCustomValueControl,
		selectedOption?.name,
		selectedOption?.size,
		value,
		isCustomValue,
		shouldUseSelectControl,
		fontSizesContainComplexValues,
	] );

	if ( ! options ) {
		return null;
	}

	// This is used for select control only. We need to add support
	// for ToggleGroupControl.
	const currentFontSizeSR = sprintf(
		// translators: %s: Currently selected font size.
		__( 'Currently selected font size: %s' ),
		selectedOption.name
	);
	const baseClassName = 'components-font-size-picker';
	return (
		<fieldset className={ baseClassName } { ...( ref ? {} : { ref } ) }>
			<VisuallyHidden as="legend">{ __( 'Font size' ) }</VisuallyHidden>
			<HStack className={ `${ baseClassName }__header` }>
				<BaseControl.VisualLabel>
					{ __( 'Size' ) }
					{ headerHint && (
						<span className={ `${ baseClassName }__header__hint` }>
							{ headerHint }
						</span>
					) }
				</BaseControl.VisualLabel>
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
			<MaybeVStack __nextHasNoMarginBottom={ __nextHasNoMarginBottom }>
				<div
					className={ classNames( `${ baseClassName }__controls`, {
						'is-next-has-no-margin-bottom': __nextHasNoMarginBottom,
					} ) }
				>
					{ !! fontSizes.length &&
						shouldUseSelectControl &&
						! showCustomValueControl && (
							<CustomSelectControl
								__nextUnconstrainedWidth
								className={ `${ baseClassName }__select` }
								label={ __( 'Font size' ) }
								hideLabelFromVision
								describedBy={ currentFontSizeSR }
								options={ options as FontSizeSelectOption[] }
								value={ (
									options as FontSizeSelectOption[]
								 ).find(
									( option ) =>
										option.key === selectedOption.slug
								) }
								onChange={ ( {
									selectedItem,
								}: {
									selectedItem: FontSizeSelectOption;
								} ) => {
									onChange(
										hasUnits
											? selectedItem.size
											: Number( selectedItem.size )
									);
									if (
										selectedItem.key === CUSTOM_FONT_SIZE
									) {
										setShowCustomValueControl( true );
									}
								} }
								size={ size }
							/>
						) }
					{ ! shouldUseSelectControl && ! showCustomValueControl && (
						<ToggleGroupControl
							__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
							label={ __( 'Font size' ) }
							hideLabelFromVision
							value={ value }
							onChange={ ( newValue ) => {
								onChange(
									hasUnits ? newValue : Number( newValue )
								);
							} }
							isBlock
							size={ size }
						>
							{ ( options as FontSizeToggleGroupOption[] ).map(
								( option ) => (
									<ToggleGroupControlOption
										key={ option.key }
										value={ option.value }
										label={ option.label }
										aria-label={ option.name }
										showTooltip={ true }
									/>
								)
							) }
						</ToggleGroupControl>
					) }
					{ ! withSlider &&
						! disableCustomFontSizes &&
						showCustomValueControl && (
							<Flex
								justify="space-between"
								className={ `${ baseClassName }__custom-size-control` }
							>
								<FlexItem isBlock>
									<UnitControl
										label={ __( 'Custom' ) }
										labelPosition="top"
										hideLabelFromVision
										value={ value }
										onChange={ ( nextSize ) => {
											if (
												! nextSize ||
												0 === parseFloat( nextSize )
											) {
												onChange( undefined );
											} else {
												onChange(
													hasUnits
														? nextSize
														: parseInt(
																nextSize,
																10
														  )
												);
											}
										} }
										size={ size }
										units={ hasUnits ? units : [] }
									/>
								</FlexItem>
								{ withReset && (
									<FlexItem isBlock>
										<Button
											className="components-color-palette__clear"
											disabled={ value === undefined }
											onClick={ () => {
												onChange( undefined );
											} }
											isSmall
											variant="secondary"
										>
											{ __( 'Reset' ) }
										</Button>
									</FlexItem>
								) }
							</Flex>
						) }
				</div>
				{ withSlider && (
					<RangeControl
						__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
						className={ `${ baseClassName }__custom-input` }
						label={ __( 'Custom Size' ) }
						value={
							isPixelValue && noUnitsValue
								? Number( noUnitsValue )
								: undefined
						}
						initialPosition={ fallbackFontSize }
						onChange={ ( newValue ) => {
							onChange( hasUnits ? newValue + 'px' : newValue );
						} }
						min={ 12 }
						max={ 100 }
					/>
				) }
			</MaybeVStack>
		</fieldset>
	);
}

export default forwardRef( FontSizePicker );
