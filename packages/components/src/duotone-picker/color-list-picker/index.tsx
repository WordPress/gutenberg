/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { swatch } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../../button';
import ColorPalette from '../../color-palette';
import ColorIndicator from '../../color-indicator';
import Icon from '../../icon';
import { HStack } from '../../h-stack';
import type { ColorListPickerProps, ColorOptionProps } from './types';
import { useInstanceId } from '@wordpress/compose';

function ColorOption( {
	label,
	value,
	colors,
	disableCustomColors,
	enableAlpha,
	onChange,
}: ColorOptionProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const idRoot = useInstanceId( ColorOption, 'color-list-picker-option' );
	const labelId = `${ idRoot }__label`;
	const contentId = `${ idRoot }__content`;

	return (
		<>
			<Button
				className="components-color-list-picker__swatch-button"
				onClick={ () => setIsOpen( ( prev ) => ! prev ) }
				aria-expanded={ isOpen }
				aria-controls={ contentId }
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
					<span id={ labelId }>{ label }</span>
				</HStack>
			</Button>
			<div
				role="group"
				id={ contentId }
				aria-labelledby={ labelId }
				aria-hidden={ ! isOpen }
			>
				{ isOpen && (
					<ColorPalette
						aria-label={ __( 'Color options' ) }
						className="components-color-list-picker__color-picker"
						colors={ colors }
						value={ value }
						clearable={ false }
						onChange={ onChange }
						disableCustomColors={ disableCustomColors }
						enableAlpha={ enableAlpha }
					/>
				) }
			</div>
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
