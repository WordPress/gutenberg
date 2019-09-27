
/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../button';
import RangeControl from '../range-control';
import FontSizePickerSelect from './select';

function getSelectValueFromFontSize( fontSizes, value ) {
	if ( value ) {
		const fontSizeValue = fontSizes.find( ( font ) => font.size === value );
		return fontSizeValue ? fontSizeValue.slug : 'custom';
	}
	// We can't be sure what the theme font settings are so let's assume the "normal" size will be second if there are more than 2 sizes, and first if there are 2 or less.
	return fontSizes.length > 2 ? fontSizes[ 1 ].slug : fontSizes[ 0 ].slug;
}

function getSelectOptions( optionsArray ) {
	return [
		...optionsArray.map( ( option ) => ( { value: option.slug, label: option.name, size: option.size } ) ),
		{ value: 'custom', label: __( 'Custom' ) },
	];
}

function FontSizePicker( {
	fallbackFontSize,
	fontSizes = [],
	disableCustomFontSizes = false,
	onChange,
	value,
	withSlider = false,
} ) {
	const [ currentSelectValue, setCurrentSelectValue ] = useState( getSelectValueFromFontSize( fontSizes, value ) );

	if ( disableCustomFontSizes && ! fontSizes.length ) {
		return null;
	}

	const onChangeValue = ( event ) => {
		const newValue = event.target.value;
		setCurrentSelectValue( getSelectValueFromFontSize( fontSizes, Number( newValue ) ) );
		if ( newValue === '' ) {
			onChange( undefined );
			return;
		}
		onChange( Number( newValue ) );
	};

	const onSelectChangeValue = ( eventValue ) => {
		setCurrentSelectValue( eventValue );
		const selectedFont = fontSizes.find( ( font ) => font.slug === eventValue );
		if ( selectedFont ) {
			onChange( selectedFont.size );
		}
	};

	return (
		<fieldset>
			<legend className="screen-reader-text">
				{ __( 'Font Size' ) }
			</legend>
			<div className="components-font-size-picker__controls">
				{ ( fontSizes.length > 0 ) &&
					<FontSizePickerSelect
						value={ currentSelectValue }
						onChange={ onSelectChangeValue }
						fontSizes={ getSelectOptions( fontSizes ) }
					/>
				}
				{ ( ! withSlider && ! disableCustomFontSizes ) &&
				// eslint-disable-next-line jsx-a11y/label-has-for
				<label className="components-range-control__label">
					{ __( 'Custom' ) }
					<input
						className="components-range-control__number"
						type="number"
						onChange={ onChangeValue }
						value={ value || '' }
					/>
				</label>
				}
				<Button
					className="components-color-palette__clear"
					type="button"
					disabled={ value === undefined }
					onClick={ () => {
						onChange( undefined );
						setCurrentSelectValue( getSelectValueFromFontSize( fontSizes, undefined ) );
					} }
					isLarge
					isDefault
				>
					{ __( 'Reset' ) }
				</Button>
			</div>
			{ withSlider &&
				<RangeControl
					className="components-font-size-picker__custom-input"
					label={ __( 'Custom Size' ) }
					value={ value || '' }
					initialPosition={ fallbackFontSize }
					onChange={ onChange }
					min={ 12 }
					max={ 100 }
					beforeIcon="editor-textcolor"
					afterIcon="editor-textcolor"
				/>
			}
		</fieldset>
	);
}

export default FontSizePicker;
