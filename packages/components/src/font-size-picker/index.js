/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';
import { useState, useMemo, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
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

function FontSizePicker(
	{
		fallbackFontSize,
		fontSizes = [],
		disableCustomFontSizes = false,
		onChange,
		value,
		withSlider = false,
		withReset = true,
	},
	ref
) {
	const hasUnits = [ typeof value, typeof fontSizes?.[ 0 ]?.size ].includes(
		'string'
	);
	const noUnitsValue = ! hasUnits ? value : parseInt( value );
	const isPixelValue = typeof value === 'number' || value?.endsWith?.( 'px' );
	const units = useCustomUnits( {
		availableUnits: [ 'px', 'em', 'rem' ],
	} );

	/**
	 * The main font size UI displays a toggle group when the presets are less
	 * than six and a select control when they are more.
	 */
	const fontSizesContainComplexValues = fontSizes.some(
		( { size } ) => ! isSimpleCssValue( size )
	);
	const shouldUseSelectControl = fontSizes.length > 5;
	const options = useMemo(
		() =>
			getFontSizeOptions(
				shouldUseSelectControl,
				fontSizes,
				disableCustomFontSizes,
				fontSizesContainComplexValues
			),
		[
			shouldUseSelectControl,
			fontSizes,
			disableCustomFontSizes,
			fontSizesContainComplexValues,
		]
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
			return isSimpleCssValue( value ) && `(${ value })`;
		}
		if ( shouldUseSelectControl ) {
			return (
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
		selectedOption?.slug,
		value,
		isCustomValue,
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
			<Flex
				justify="space-between"
				className={ `${ baseClassName }__header` }
			>
				<FlexItem>
					{ __( 'Size' ) }
					{ headerHint && (
						<span className={ `${ baseClassName }__header__hint` }>
							{ headerHint }
						</span>
					) }
				</FlexItem>
				{ ! disableCustomFontSizes && (
					<FlexItem>
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
					</FlexItem>
				) }
			</Flex>
			<div className={ `${ baseClassName }__controls` }>
				{ !! fontSizes.length &&
					shouldUseSelectControl &&
					! showCustomValueControl && (
						<CustomSelectControl
							className={ `${ baseClassName }__select` }
							label={ __( 'Font size' ) }
							hideLabelFromVision
							describedBy={ currentFontSizeSR }
							options={ options }
							value={ options.find(
								( option ) => option.key === selectedOption.slug
							) }
							onChange={ ( { selectedItem } ) => {
								onChange(
									hasUnits
										? selectedItem.size
										: Number( selectedItem.size )
								);
								if ( selectedItem.key === CUSTOM_FONT_SIZE ) {
									setShowCustomValueControl( true );
								}
							} }
						/>
					) }
				{ ! shouldUseSelectControl && ! showCustomValueControl && (
					<ToggleGroupControl
						label={ __( 'Font size' ) }
						hideLabelFromVision
						value={ value }
						onChange={ ( newValue ) => {
							onChange(
								hasUnits ? newValue : Number( newValue )
							);
						} }
						isBlock
					>
						{ options.map( ( option ) => (
							<ToggleGroupControlOption
								key={ option.key }
								value={ option.value }
								label={ option.label }
								aria-label={ option.name }
								showTooltip={ true }
							/>
						) ) }
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
											0 === parseFloat( nextSize ) ||
											! nextSize
										) {
											onChange( undefined );
										} else {
											onChange(
												hasUnits
													? nextSize
													: parseInt( nextSize, 10 )
											);
										}
									} }
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
					className={ `${ baseClassName }__custom-input` }
					label={ __( 'Custom Size' ) }
					value={ ( isPixelValue && noUnitsValue ) || '' }
					initialPosition={ fallbackFontSize }
					onChange={ ( newValue ) => {
						onChange( hasUnits ? newValue + 'px' : newValue );
					} }
					min={ 12 }
					max={ 100 }
				/>
			) }
		</fieldset>
	);
}

export default forwardRef( FontSizePicker );
