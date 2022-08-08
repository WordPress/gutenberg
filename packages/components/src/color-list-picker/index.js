/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { swatch } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';
import ColorPalette from '../color-palette';
import ColorIndicator from '../color-indicator';
import Icon from '../icon';
import { Flex, FlexItem } from '../flex';

function ColorOption( {
	label,
	value,
	colors,
	disableCustomColors,
	enableAlpha,
	onChange,
} ) {
	const [ isOpen, setIsOpen ] = useState( false );
	return (
		<>
			<Button
				className="components-color-list-picker__swatch-button"
				onClick={ () => setIsOpen( ( prev ) => ! prev ) }
			>
				<Flex justify="flex-start">
					{ value ? (
						<ColorIndicator colorValue={ value } />
					) : (
						<Icon icon={ swatch } />
					) }
					<FlexItem>{ label }</FlexItem>
				</Flex>
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
					enableAlpha={ enableAlpha }
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
