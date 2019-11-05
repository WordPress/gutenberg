
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
import CustomSelect from '../custom-select';

function getSelectValueFromFontSize( fontSizes, value ) {
	if ( value ) {
		const fontSizeValue = fontSizes.find( ( font ) => font.size === value );
		return fontSizeValue ? fontSizeValue.slug : 'custom';
	}
	return 'normal';
}

function getSelectOptions( optionsArray ) {
	return [
		...optionsArray.map( ( option ) => ( {
			key: option.slug,
			name: option.name,
			style: { fontSize: option.size },
		} ) ),
		{ key: 'custom', name: __( 'Custom' ) },
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

	const onSelectChangeValue = ( { selectedItem } ) => {
		setCurrentSelectValue( selectedItem.key );
		onChange( selectedItem.style && selectedItem.style.fontSize );
	};

	const items = getSelectOptions( fontSizes );
	return (
		<fieldset className="components-font-size-picker">
			<legend>
				{ __( 'Font Size' ) }
			</legend>
			<div className="components-font-size-picker__controls">
				{ ( fontSizes.length > 0 ) &&
					<CustomSelect
						className={ 'components-font-size-picker__select' }
						hideLabelFromVision
						label={ 'Choose preset' }
						items={ items }
						selectedItem={ items.find( ( item ) => item.key === currentSelectValue ) || items[ 0 ] }
						onSelectedItemChange={ onSelectChangeValue }
					/>
				}
				{ ( ! withSlider && ! disableCustomFontSizes ) &&
					<input
						className="components-range-control__number"
						type="number"
						onChange={ onChangeValue }
						aria-label={ __( 'Custom' ) }
						value={ value || '' }
					/>
				}
				<Button
					className="components-color-palette__clear"
					type="button"
					disabled={ value === undefined }
					onClick={ () => {
						onChange( undefined );
						setCurrentSelectValue( getSelectValueFromFontSize( fontSizes, undefined ) );
					} }
					isSmall
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
