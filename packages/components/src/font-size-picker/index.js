
/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import ButtonGroup from '../button-group';
import Button from '../button';
import RangeControl from '../range-control';

function getSelectValueFromFontSize( fontSizes, value ) {
	if ( value ) {
		const fontSizeValue = fontSizes.find( ( font ) => font.size === value );
		return fontSizeValue ? fontSizeValue.slug : 'custom';
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
	instanceId,
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

	const onSelectChangeValue = ( { currentTarget: { id: eventValue } } ) => {
		setCurrentSelectValue( eventValue );
		const selectedFont = fontSizes.find( ( font ) => font.slug === eventValue );
		if ( selectedFont ) {
			onChange( selectedFont.size );
		}
	};

	return (
		<fieldset>
			<legend>
				{ __( 'Font Size' ) }
			</legend>
			<div className="components-font-size-picker__controls">
				{ ( fontSizes.length > 0 ) &&
					<ButtonGroup
						className="components-font-size-picker__button-group"
						aria-label={ __( 'Font Size Preset' ) }
					>
						{ fontSizes.map( ( fontSize ) => {
							const selected = fontSize.slug === currentSelectValue;
							return (
								<Button
									key={ fontSize.slug }
									id={ fontSize.slug }
									className="components-font-size-picker__button-group-button"
									onClick={ onSelectChangeValue }
									aria-pressed={ selected }
									isPrimary={ selected }
									style={ { fontSize: fontSize.size } }
									isDefault
								>
									{ fontSize.name }
								</Button>
							);
						} ) }
					</ButtonGroup>
				}
				{ ( ! withSlider && ! disableCustomFontSizes ) &&
					<>
						<label htmlFor={ `components-range-control__number-${ instanceId }` }>
							{ __( 'Custom' ) }
						</label>
						<input
							id={ `components-range-control__number-${ instanceId }` }
							className="components-range-control__number"
							type="number"
							onChange={ onChangeValue }
							aria-label={ __( 'Custom' ) }
							value={ value || '' }
						/>
					</>
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

export default withInstanceId( FontSizePicker );
