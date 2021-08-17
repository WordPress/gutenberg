/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import ColorPalette from '../color-palette';
import Swatch from '../swatch';

function ColorOption( {
	label,
	value,
	colors,
	disableCustomColors,
	disableAlpha,
	onChange,
} ) {
	const [ isOpen, setIsOpen ] = useState( false );
	return (
		<>
			<Button
				className="components-color-list-picker__swatch-button"
				icon={ <Swatch fill={ value } /> }
				onClick={ () => setIsOpen( ( prev ) => ! prev ) }
			>
				{ label }
			</Button>
			{ isOpen && (
				<ColorPalette
					colors={ colors }
					value={ value }
					clearable={ false }
					onChange={ onChange }
					disableCustomColors={ disableCustomColors }
					disableAlpha={ disableAlpha }
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
	disableAlpha,
	onChange,
} ) {
	return (
		<div className="components-color-list-picker">
			{ labels.map( ( label, index ) => (
				<ColorOption
					key={ index }
					label={ label }
					value={ value[ index ] }
					colors={ colors }
					disableCustomColors={ disableCustomColors }
					disableAlpha={ disableAlpha }
					onChange={ ( newColor ) => {
						const newColors = value.slice();
						newColors[ index ] = newColor;
						onChange( newColors );
					} }
				/>
			) ) }
		</div>
	);
}

export default ColorListPicker;
