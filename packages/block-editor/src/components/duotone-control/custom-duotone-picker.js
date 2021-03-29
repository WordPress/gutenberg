/**
 * WordPress dependencies
 */
import { Button, ColorPalette, Icon } from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { swatch } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Swatch from './duotone-swatch';
import {
	getDefaultColors,
	getHexColorsFromValues,
	getValuesFromColors,
} from './utils';

function CustomColorOption( { label, value, colors, onChange } ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const icon = value ? <Swatch fill={ value } /> : <Icon icon={ swatch } />;
	return (
		<>
			<Button
				className="block-editor-duotone-control__color-button"
				icon={ icon }
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
				/>
			) }
		</>
	);
}

function CustomColorPicker( { colors, palette, onChange } ) {
	const [ defaultDark, defaultLight ] = useMemo(
		() => getDefaultColors( palette ),
		[ palette ]
	);

	return (
		<div className="block-editor-duotone-control__custom-colors">
			<CustomColorOption
				label={ __( 'Shadows' ) }
				value={ colors[ 0 ] }
				colors={ palette }
				onChange={ ( newColor ) => {
					const newColors = colors.slice();
					newColors[ 0 ] = newColor;
					if ( ! newColors[ 0 ] ) {
						newColors[ 0 ] = defaultDark;
					}
					if ( ! newColors[ 1 ] ) {
						newColors[ 1 ] = defaultLight;
					}
					onChange( newColors );
				} }
			/>
			<CustomColorOption
				label={ __( 'Highlights' ) }
				value={ colors[ 1 ] }
				colors={ palette }
				onChange={ ( newColor ) => {
					const newColors = colors.slice();
					newColors[ 1 ] = newColor;
					if ( ! newColors[ 0 ] ) {
						newColors[ 0 ] = defaultDark;
					}
					if ( ! newColors[ 1 ] ) {
						newColors[ 1 ] = defaultLight;
					}
					onChange( newColors );
				} }
			/>
		</div>
	);
}

function CustomDuotonePicker( { colorPalette, value, onChange } ) {
	return (
		<CustomColorPicker
			colors={ getHexColorsFromValues( value?.values ) }
			palette={ colorPalette }
			onChange={ ( newColors ) => {
				const newValue = {
					values: getValuesFromColors( newColors ),
				};
				onChange( newColors.length >= 2 ? newValue : undefined );
			} }
		/>
	);
}

export default CustomDuotonePicker;
