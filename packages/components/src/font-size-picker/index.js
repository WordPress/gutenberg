
/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../button';
import RangeControl from '../range-control';
import SelectControl from '../select-control';

function getInitialSlug( fontSizes, value ) {
	if ( value ) {
		const initialValue = fontSizes.find( ( font ) => font.size === value );
		return initialValue ? initialValue.slug : 'custom';
	}
	return 'normal';
}

function FontSizePicker( {
	fallbackFontSize,
	fontSizes = [],
	disableCustomFontSizes = false,
	onChange,
	value,
	withSlider = false,
} ) {
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const [ currentSlug, setCurrentSlug ] = useState( getInitialSlug( fontSizes, value ) );

	if ( disableCustomFontSizes && ! fontSizes.length ) {
		return null;
	}

	const onChangeValue = ( event ) => {
		const newValue = event.target.value;
		if ( newValue === '' ) {
			onChange( undefined );
			return;
		}
		setCurrentSlug( getInitialSlug( fontSizes, Number( newValue ) ) );
		onChange( Number( newValue ) );
	};

	const onSelectChangeValue = ( eventValue ) => {
		setCurrentSlug( eventValue );
		const selectedFont = fontSizes.find( ( font ) => font.slug === eventValue );

		if ( selectedFont ) {
			onChange( selectedFont.size );
		}
	};

	// const defaultFont = fontSizes.find( ( font ) => font.slug === 'normal' );

	return (
		<fieldset>
			<legend>
				{ __( 'Font Size' ) }
			</legend>
			<div className="components-font-size-picker__controls">
				{ ( fontSizes.length > 0 ) &&
					<SelectControl
						className={ 'components-font-size-picker__select' }
						label={ 'Choose preset' }
						hideLabel={ true }
						value={ currentSlug }
						onChange={ onSelectChangeValue }
						options={ [
							{ value: fontSizes[ 0 ].slug, label: __( 'Small' ) },
							{ value: fontSizes[ 1 ].slug, label: __( 'Normal' ) },
							{ value: fontSizes[ 2 ].slug, label: __( 'Large' ) },
							{ value: fontSizes[ 3 ].slug, label: __( 'Huge' ) },
							{ value: 'custom', label: __( 'Custom' ) },
						] }
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
					onClick={ () => onChange( undefined ) }
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
