/**
 * External dependencies
 */
import { isNumber, isString } from 'lodash';

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

const DEFAULT_FONT_SIZE = 'default';
const DEFAULT_FONT_SIZE_OPTION = {
	slug: DEFAULT_FONT_SIZE,
	name: __( 'Default' ),
};
const CUSTOM_FONT_SIZE = 'custom';
const CUSTOM_FONT_SIZE_OPTION = {
	slug: CUSTOM_FONT_SIZE,
	name: __( 'Custom' ),
};

function getSelectedOption( fontSizes, value ) {
	if ( ! value ) {
		return DEFAULT_FONT_SIZE_OPTION;
	}
	return (
		fontSizes.find( ( font ) => font.size === value ) ||
		CUSTOM_FONT_SIZE_OPTION
	);
}

function getSelectValueFromFontSize( fontSizes, value ) {
	if ( value ) {
		const fontSizeValue = fontSizes.find( ( font ) => font.size === value );
		return fontSizeValue ? fontSizeValue.slug : CUSTOM_FONT_SIZE;
	}
	return DEFAULT_FONT_SIZE;
}

function getSelectOptions( optionsArray, disableCustomFontSizes ) {
	if ( disableCustomFontSizes && ! optionsArray.length ) {
		return null;
	}
	optionsArray = [
		// TODO: check what to do with `default` option.
		{ slug: DEFAULT_FONT_SIZE, name: __( 'Default' ) },
		...optionsArray,
		// TODO: check the `custom` one.. probably remove as well
		...( disableCustomFontSizes
			? []
			: [ { slug: CUSTOM_FONT_SIZE, name: __( 'Custom' ) } ] ),
	];
	return optionsArray.map( ( option ) => ( {
		key: option.slug,
		name: option.name,
		size: option.size,
		hint:
			option.size &&
			isSimpleCssValue( option.size ) &&
			parseInt( option.size ),
	} ) );
}

/**
 * Some themes use css vars for their font sizes, so until we
 * have the way of calculating them don't display them.
 *
 * @param {*} value The value that is checked.
 * @return {boolean} Whether the value is a simple css value.
 */
function isSimpleCssValue( value ) {
	const sizeRegex = /^(?!0)\d+(px|em|rem|vw|vh|%)?$/i;
	return sizeRegex.test( value );
}

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
	const hasUnits =
		isString( value ) ||
		( fontSizes[ 0 ] && isString( fontSizes[ 0 ].size ) );

	const noUnitsValue = ! hasUnits ? value : parseInt( value );

	// TODO: check the below logic
	const isPixelValue =
		isNumber( value ) || ( isString( value ) && value.endsWith( 'px' ) );

	// TODO: check to use supplied available font size units
	const units = useCustomUnits( {
		availableUnits: [ 'px', 'em', 'rem' ],
	} );

	const options = useMemo(
		() => getSelectOptions( fontSizes, disableCustomFontSizes ),
		[ fontSizes, disableCustomFontSizes ]
	);
	const selectedOption = getSelectedOption( fontSizes, value );
	const isCustomValue = selectedOption.slug === CUSTOM_FONT_SIZE;
	// const isDefaultValue = selectedOption.slug === DEFAULT_FONT_SIZE;
	const [ showCustomValueControl, setShowCustomValueControl ] = useState(
		isCustomValue
	);

	if ( ! options ) {
		return null;
	}

	const selectedFontSizeSlug = getSelectValueFromFontSize( fontSizes, value );

	const currentFontSizeSR = sprintf(
		// translators: %s: Currently selected font size.
		__( 'Currently selected font size: %s' ),
		options.find( ( option ) => option.key === selectedFontSizeSlug ).name
	);

	const baseClassName = 'components-font-size-picker';
	// TODO: check to remove function or put it outside the component..
	const getHeaderHint = ( _selectedOption, _showCustomValueControl ) => {
		if ( _showCustomValueControl ) {
			return __( 'custom' );
		}
		// TODO take into account if control is `select` or `toggleGroup`..
		let hint = _selectedOption?.size;
		if ( selectedOption.slug === CUSTOM_FONT_SIZE ) {
			hint = value;
		}
		if ( isSimpleCssValue( hint ) ) {
			return hint;
		}
	};
	const headerHint = getHeaderHint( selectedOption, showCustomValueControl );
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
							({ headerHint })
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
				{ fontSizes.length > 0 && ! showCustomValueControl && (
					<CustomSelectControl
						className={ `${ baseClassName }__select` }
						label={ __( 'Font size' ) }
						describedBy={ currentFontSizeSR }
						options={ options }
						value={ options.find(
							( option ) => option.key === selectedFontSizeSlug
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
						hideLabelFromVision
					/>
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
