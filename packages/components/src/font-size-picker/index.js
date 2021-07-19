/**
 * External dependencies
 */
import { isNumber, isString } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { textColor } from '@wordpress/icons';
import { useMemo, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import RangeControl from '../range-control';
import { default as UnitControl, useCustomUnits } from '../unit-control';
import CustomSelectControl from '../custom-select-control';
import { VisuallyHidden } from '../visually-hidden';
import CheckboxControl from '../checkbox-control';

const DEFAULT_FONT_SIZE = 'default';
const CUSTOM_FONT_SIZE = 'custom';
const MAX_FONT_SIZE_DISPLAY = '25px';

/* Responsive value helpers */
const minFontSize = '12px';
const valueMatcher = '(?<val>[0-9\\.]*[a-z%]*)';
const valuePlaceholder = '\\k<val>';
const minMaxRate = '8vw';
const slope = '0';
const space = '\\s*';
const valueRefex = new RegExp(
	`${ space }clamp\\(${ space }calc\\(${ space }${ minFontSize }${ space }-${ space }\\(${ space }\\(${ space }${ minFontSize }${ space }-${ space }${ valueMatcher }${ space }\\)${ space }\\*${ space }${ slope }${ space }\\)${ space }\\)${ space },${ space }${ valuePlaceholder }${ space },${ space }calc\\(${ space }calc\\(${ space }${ minFontSize }${ space }\\+${ space }${ minMaxRate }${ space }\\)${ space }\\+${ space }\\(${ space }\\(${ space }${ valuePlaceholder }${ space }-${ space }calc\\(${ space }${ minFontSize }${ space }\\+${ space }${ minMaxRate }${ space }\\)${ space }\\)${ space }\\*${ space }${ slope }${ space }\\)${ space }\\)${ space }\\)${ space }`,
	'g'
);

function clampValue( value ) {
	return `clamp( calc( ${ minFontSize } - ( ( ${ minFontSize } - ${ value } ) * ${ slope } ) ) , ${ value } , calc( calc( ${ minFontSize } + ${ minMaxRate } ) + ( ( ${ value } - calc( ${ minFontSize } + ${ minMaxRate } ) ) * ${ slope } ) ) )`;
}

function isResponsiveValue( responsiveValue ) {
	return responsiveValue.match( valueRefex ) !== null;
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
		{ slug: DEFAULT_FONT_SIZE, name: __( 'Default' ) },
		...optionsArray,
		...( disableCustomFontSizes
			? []
			: [ { slug: CUSTOM_FONT_SIZE, name: __( 'Custom' ) } ] ),
	];
	return optionsArray.map( ( option ) => ( {
		key: option.slug,
		name: option.name,
		size: option.size,
		style: {
			fontSize: `min( ${ option.size }, ${ MAX_FONT_SIZE_DISPLAY } )`,
		},
	} ) );
}

function parseFontSizeValue( fullValue ) {
	if ( ! fullValue ) {
		return {
			numericValue: undefined,
			value: undefined,
			isPixed: false,
			isResponsive: false,
		};
	}

	const isResponsive = isResponsiveValue( fullValue );
	const value = isResponsive
		? valueRefex.exec( fullValue ).groups.val
		: fullValue;

	const hasUnits = isString( value );
	let noUnitsValue;
	if ( ! hasUnits ) {
		noUnitsValue = value;
	} else {
		noUnitsValue = parseInt( value );
	}

	return {
		value,
		numericValue: noUnitsValue,
		isPixel:
			isNumber( value ) ||
			( isString( value ) && value.endsWith( 'px' ) ),
		isResponsive,
	};
}

function CustomFontSizePicker( {
	value: fullValue,
	onChange,
	withSlider,
	fallbackFontSize,
	hasUnits,
} ) {
	const units = useCustomUnits( {
		availableUnits: [ 'px', 'em', 'rem' ],
	} );
	const { value, numericValue, isPixel, isResponsive } = parseFontSizeValue(
		fullValue
	);

	return (
		<>
			{ ! withSlider && (
				<UnitControl
					label={ __( 'Custom' ) }
					labelPosition="top"
					__unstableInputWidth="60px"
					value={ value }
					onChange={ ( nextSize ) => {
						if ( 0 === parseFloat( nextSize ) || ! nextSize ) {
							onChange( undefined );
						} else {
							onChange(
								isResponsive ? clampValue( nextSize ) : nextSize
							);
						}
					} }
					units={ units }
				/>
			) }

			{ withSlider && (
				<RangeControl
					className="components-font-size-picker__custom-input"
					label={ __( 'Custom Size' ) }
					value={ ( isPixel && numericValue ) || '' }
					initialPosition={ fallbackFontSize }
					onChange={ ( newValue ) => {
						const withUnits = hasUnits ? newValue + 'px' : newValue;
						onChange(
							isResponsive ? clampValue( withUnits ) : withUnits
						);
					} }
					min={ 12 }
					max={ 100 }
					beforeIcon={ textColor }
					afterIcon={ textColor }
				/>
			) }

			<CheckboxControl
				label={ __( 'Adapt to the window size' ) }
				checked={ isResponsive }
				onChange={ () => {
					if ( isResponsive ) {
						onChange( value );
					} else {
						onChange( clampValue( value ) );
					}
				} }
			/>
		</>
	);
}

function FontSizePicker(
	{
		fallbackFontSize,
		fontSizes = [],
		disableCustomFontSizes = false,
		onChange,
		value,
		withSlider = false,
	},
	ref
) {
	const options = useMemo(
		() => getSelectOptions( fontSizes, disableCustomFontSizes ),
		[ fontSizes, disableCustomFontSizes ]
	);

	const hasUnits =
		isString( value ) ||
		( fontSizes[ 0 ] && isString( fontSizes[ 0 ].size ) );

	if ( ! options ) {
		return null;
	}

	const selectedFontSizeSlug = getSelectValueFromFontSize( fontSizes, value );

	return (
		<fieldset
			className="components-font-size-picker"
			{ ...( ref ? {} : { ref } ) }
		>
			<VisuallyHidden as="legend">{ __( 'Font size' ) }</VisuallyHidden>
			<div className="components-font-size-picker__controls">
				{ fontSizes.length > 0 && (
					<CustomSelectControl
						className={ 'components-font-size-picker__select' }
						label={ __( 'Font size' ) }
						options={ options }
						value={ options.find(
							( option ) => option.key === selectedFontSizeSlug
						) }
						onChange={ ( { selectedItem } ) => {
							if ( hasUnits ) {
								onChange( selectedItem.size );
							} else {
								onChange( Number( selectedItem.size ) );
							}
						} }
					/>
				) }
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
			</div>
			{ ! disableCustomFontSizes && (
				<CustomFontSizePicker
					value={ value }
					onChange={ onChange }
					withSlider={ withSlider }
					fallbackFontSize={ fallbackFontSize }
					hasUnits={ hasUnits }
				/>
			) }
		</fieldset>
	);
}

export default forwardRef( FontSizePicker );
