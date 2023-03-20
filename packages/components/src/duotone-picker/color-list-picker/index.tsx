/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { swatch } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../../button';
import ColorPalette from '../../color-palette';
import ColorIndicator from '../../color-indicator';
import Icon from '../../icon';
import { HStack } from '../../h-stack';
import type { ColorListPickerProps, ColorOptionProps } from './types';

function ColorOption( {
	label,
	value,
	colors,
	disableCustomColors,
	enableAlpha,
	onChange,
}: ColorOptionProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	return (
		<>
			<Button
				className="components-color-list-picker__swatch-button"
				onClick={ () => setIsOpen( ( prev ) => ! prev ) }
			>
				<HStack justify="flex-start" spacing={ 2 }>
					{ value ? (
						<ColorIndicator
							colorValue={ value }
							className="components-color-list-picker__swatch-color"
						/>
					) : (
						<Icon icon={ swatch } />
					) }
					<span>{ label }</span>
				</HStack>
			</Button>
			{ isOpen && (
				<ColorPalette
					className="components-color-list-picker__color-picker"
					colors={ colors }
					value={ value }
					clearable={ false }
					onChange={ onChange }
					disableCustomColors={ disableCustomColors }
					enableAlpha={ enableAlpha }
				/>
			) }
		</>
	);
}

function ColorListPicker( {
	colors,
	labels,
	value = [],
	disableCustomColors,
	enableAlpha,
	onChange,
}: ColorListPickerProps ) {
	return (
		<div className="components-color-list-picker">
			{ labels.map( ( label, index ) => (
				<ColorOption
					key={ index }
					label={ label }
					value={ value[ index ] }
					colors={ colors }
					disableCustomColors={ disableCustomColors }
					enableAlpha={ enableAlpha }
					onChange={ ( newColor ) => {
						const newColors: ( string | undefined )[] =
							value.slice();
						newColors[ index ] = newColor;
						onChange( newColors );
					} }
				/>
			) ) }
		</div>
	);
}

export default ColorListPicker;
