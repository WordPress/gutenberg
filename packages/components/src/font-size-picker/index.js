/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { textColor } from '@wordpress/icons';

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
		const fontSizeValue = fontSizes.find(
			( font ) => font.size === Number( value )
		);
		return fontSizeValue ? fontSizeValue.slug : CUSTOM_FONT_SIZE;
	}
	return DEFAULT_FONT_SIZE;
}

function getSelectOptions( optionsArray, disableCustomFontSizes ) {
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
	const instanceId = useInstanceId( FontSizePicker );
	const [ currentSelectValue, setCurrentSelectValue ] = useState(
		getSelectValueFromFontSize( fontSizes, value )
	);

	if ( disableCustomFontSizes && ! fontSizes.length ) {
		return null;
	}

	const setFontSize = ( fontSizeKey, fontSizeValue ) => {
		setCurrentSelectValue( fontSizeKey );

		if ( fontSizeKey === DEFAULT_FONT_SIZE ) {
			onChange( undefined );
			return;
		}

		if ( ! fontSizeValue ) {
			return;
		}

		onChange( Number( fontSizeValue ) );
	};

	const onChangeValue = ( event ) => {
		const newValue = event.target.value;
		const key = getSelectValueFromFontSize( fontSizes, newValue );
		setFontSize( key, newValue );
	};

	const onSelectChangeValue = ( { selectedItem } ) => {
		const selectedKey = selectedItem.key;
		const selectedValue = selectedItem.style && selectedItem.style.fontSize;
		setFontSize( selectedKey, selectedValue );
	};

	const onSliderChangeValue = ( sliderValue ) => {
		const sliderKey = getSelectValueFromFontSize( fontSizes, sliderValue );
		setFontSize( sliderKey, sliderValue );
	};

	const reset = () => {
		setFontSize( DEFAULT_FONT_SIZE );
	};

	const options = getSelectOptions( fontSizes, disableCustomFontSizes );

	const fontSizePickerNumberId = `components-font-size-picker__number#${ instanceId }`;
	return (
		<fieldset className="components-font-size-picker">
			<VisuallyHidden as="legend">{ __( 'Font size' ) }</VisuallyHidden>
			<div className="components-font-size-picker__controls">
				{ fontSizes.length > 0 && (
					<CustomSelectControl
						className={ 'components-font-size-picker__select' }
						label={ __( 'Preset size' ) }
						options={ options }
						value={
							options.find(
								( option ) => option.key === currentSelectValue
							) || options[ 0 ]
						}
						onChange={ onSelectChangeValue }
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
							onChange={ onChangeValue }
							aria-label={ __( 'Custom' ) }
							value={ value || '' }
						/>
					</div>
				) }
				<Button
					className="components-color-palette__clear"
					disabled={ value === undefined }
					onClick={ reset }
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
					value={ value || '' }
					initialPosition={ fallbackFontSize }
					onChange={ onSliderChangeValue }
					min={ 12 }
					max={ 100 }
					beforeIcon={ textColor }
					afterIcon={ textColor }
				/>
			) }
		</fieldset>
	);
}
