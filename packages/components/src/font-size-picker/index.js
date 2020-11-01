/**
 * External dependencies
 */
import { isNumber, isString } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { textColor } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import RangeControl from '../range-control';
import CustomSelectControl from '../custom-select-control';
import VisuallyHidden from '../visually-hidden';

const DEFAULT_FONT_SIZE = 'default';
const CUSTOM_FONT_SIZE = 'custom';

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
		style: { fontSize: option.size },
	} ) );
}

export default function FontSizePicker( {
	fallbackFontSize,
	fontSizes = [],
	disableCustomFontSizes = false,
	onChange,
	value,
	withSlider = false,
} ) {
	const hasUnits =
		isString( value ) ||
		( fontSizes[ 0 ] && isString( fontSizes[ 0 ].size ) );

	let noUnitsValue;
	if ( ! hasUnits ) {
		noUnitsValue = value;
	} else {
		noUnitsValue = parseInt( value );
	}

	const isPixelValue =
		isNumber( value ) || ( isString( value ) && value.endsWith( 'px' ) );

	const instanceId = useInstanceId( FontSizePicker );

	const options = useMemo(
		() => getSelectOptions( fontSizes, disableCustomFontSizes ),
		[ fontSizes, disableCustomFontSizes ]
	);

	if ( ! options ) {
		return null;
	}

	const selectedFontSizeSlug = getSelectValueFromFontSize( fontSizes, value );

	const fontSizePickerNumberId = `components-font-size-picker__number#${ instanceId }`;

	return (
		<fieldset className="components-font-size-picker">
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
				{ ! withSlider && ! disableCustomFontSizes && (
					<div className="components-font-size-picker__number-container">
						<label htmlFor={ fontSizePickerNumberId }>
							{ __( 'Custom' ) }
						</label>
						<input
							id={ fontSizePickerNumberId }
							className="components-font-size-picker__number"
							type="number"
							min={ 1 }
							onChange={ ( event ) => {
								if ( hasUnits ) {
									onChange( event.target.value + 'px' );
								} else {
									onChange( Number( event.target.value ) );
								}
							} }
							aria-label={ __( 'Custom' ) }
							value={ ( isPixelValue && noUnitsValue ) || '' }
						/>
					</div>
				) }
				<Button
					className="components-color-palette__clear"
					disabled={ value === undefined }
					onClick={ () => {
						onChange( undefined );
					} }
					isSmall
					isSecondary
				>
					{ __( 'Reset' ) }
				</Button>
			</div>
			{ withSlider && (
				<RangeControl
					className="components-font-size-picker__custom-input"
					label={ __( 'Custom Size' ) }
					value={ ( isPixelValue && noUnitsValue ) || '' }
					initialPosition={ fallbackFontSize }
					onChange={ ( newValue ) => {
						onChange( hasUnits ? newValue + 'px' : newValue );
					} }
					min={ 12 }
					max={ 100 }
					beforeIcon={ textColor }
					afterIcon={ textColor }
				/>
			) }
		</fieldset>
	);
}
