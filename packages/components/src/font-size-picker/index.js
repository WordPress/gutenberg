
/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Button from '../button';
import RangeControl from '../range-control';
import CustomSelectControl from '../custom-select-control';

function getSelectValueFromFontSize( fontSizes, value ) {
	if ( value ) {
		const fontSizeValue = fontSizes.find( ( font ) => font.size === value );
		return fontSizeValue ? fontSizeValue.slug : 'custom';
	}
	return 'normal';
}

function getSelectOptions( optionsArray, disableCustomFontSizes ) {
	if ( ! disableCustomFontSizes ) {
		optionsArray = [
			...optionsArray,
			{ slug: 'custom', name: __( 'Custom' ) },
		];
	}
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
	const instanceId = useInstanceId();
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

	const onSliderChangeValue = ( sliderValue ) => {
		onChange( sliderValue );
		setCurrentSelectValue( getSelectValueFromFontSize( fontSizes, sliderValue ) );
	};

	const options = getSelectOptions( fontSizes, disableCustomFontSizes );
	const rangeControlNumberId = `components-range-control__number#${ instanceId }`;
	return (
		<fieldset className="components-font-size-picker">
			<legend className="screen-reader-text">
				{ __( 'Font Size' ) }
			</legend>
			<div className="components-font-size-picker__controls">
				{ fontSizes.length > 0 && (
					<CustomSelectControl
						className={ 'components-font-size-picker__select' }
						label={ __( 'Preset Size' ) }
						options={ options }
						value={
							options.find( ( option ) => option.key === currentSelectValue ) ||
							options[ 0 ]
						}
						onChange={ onSelectChangeValue }
					/>
				) }
				{ ( ! withSlider && ! disableCustomFontSizes ) &&
					<div className="components-range-control__number-container">
						<label htmlFor={ rangeControlNumberId }>{ __( 'Custom' ) }</label>
						<input
							id={ rangeControlNumberId }
							className="components-range-control__number"
							type="number"
							onChange={ onChangeValue }
							aria-label={ __( 'Custom' ) }
							value={ value || '' }
						/>
					</div>
				}
				<Button
					className="components-color-palette__clear"
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
					onChange={ onSliderChangeValue }
					min={ 12 }
					max={ 100 }
					beforeIcon="editor-textcolor"
					afterIcon="editor-textcolor"
				/>
			}
		</fieldset>
	);
}
