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
	const hasUnits = [ typeof value, typeof fontSizes?.[ 0 ].size ].includes(
		'string'
	);
	const noUnitsValue = ! hasUnits ? value : parseInt( value );
	const isPixelValue = typeof value === 'number' || value?.endsWith?.( 'px' );
	const units = useCustomUnits( {
		availableUnits: [ 'px', 'em', 'rem' ],
	} );

	/**
	 * We use the select control if the available font sizes are `more` than five
	 * and when are `less` than five but there is at least on font size that has
	 * not a simple css var (eg. 'calc', 'var', etc..).
	 *
	 * This will need to be updated when we'll have the way of calculating them.
	 */
	const useSelectControl =
		fontSizes?.length > 5 ||
		fontSizes.some( ( { size } ) => ! isSimpleCssValue( size ) );

	const options = useMemo(
		() =>
			getFontSizeOptions(
				useSelectControl,
				fontSizes,
				disableCustomFontSizes
			),
		[ useSelectControl, fontSizes, disableCustomFontSizes ]
	);
	const selectedOption = getSelectedOption( fontSizes, value );
	const isCustomValue = selectedOption.slug === CUSTOM_FONT_SIZE;
	const [ showCustomValueControl, setShowCustomValueControl ] = useState(
		! disableCustomFontSizes && isCustomValue
	);
	const headerHint = useMemo( () => {
		if ( showCustomValueControl ) {
			return `(${ __( 'custom' ) })`;
		}
		/**
		 * If we have a custom value that is not available in
		 * the font sizes, show it as a hint if a simple css value.
		 */
		if ( isCustomValue ) {
			return isSimpleCssValue( value ) && `(${ value })`;
		}
		if ( useSelectControl ) {
			return (
				isSimpleCssValue( selectedOption?.size ) &&
				`(${ selectedOption?.size })`
			);
		}
		// Calculate the `hint` for toggle group control.
		let hint = selectedOption.name;
		if ( typeof selectedOption.size === 'string' ) {
			const [ , unit ] = splitValueAndUnitFromSize( selectedOption.size );
			hint += `(${ unit })`;
		}
		return hint;
	}, [ showCustomValueControl, selectedOption?.slug, value, isCustomValue ] );

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
							icon={ settings }
							onClick={ () => {
								setShowCustomValueControl(
									! showCustomValueControl
								);
							} }
							isPressed={ showCustomValueControl }
							isSmall
						></Button>
					</FlexItem>
				) }
			</Flex>
			<div className={ `${ baseClassName }__controls` }>
				{ !! fontSizes.length &&
					useSelectControl &&
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
				{ ! useSelectControl && ! showCustomValueControl && (
					<ToggleGroupControl
						label={ __( 'Font size' ) }
						hideLabelFromVision
						value={ value }
						onChange={ ( newValue ) => {
							// TODO: related to `reset`. Should we show the button?
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
									units={ hasUnits ? units : false }
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
