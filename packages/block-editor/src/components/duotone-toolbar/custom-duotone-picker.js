/**
 * WordPress dependencies
 */
import { Button, ColorPalette, Icon } from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { noFilter } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Swatch from './duotone-swatch';
import {
	getDefaultColors,
	getHexColorsFromValues,
	getValuesFromHexColors,
} from './utils';

function CustomColorOption( { label, value, colors, onChange } ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const icon = value ? <Swatch fill={ value } /> : <Icon icon={ noFilter } />;
	return (
		<>
			<Button
				className="block-editor-duotone-toolbar__color-button"
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
		<div className="block-editor-duotone-toolbar__custom-colors">
			<CustomColorOption
				label={ __( 'Dark Color' ) }
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
				label={ __( 'Light Color' ) }
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
			onChange={ ( newColors ) =>
				onChange(
					newColors.length >= 2
						? {
								values: getValuesFromHexColors( newColors ),
								id: `duotone-filter-custom-${ newColors
									.map( ( hex ) =>
										hex.slice( 1 ).toLowerCase()
									)
									.join( '-' ) }`,
						  }
						: undefined
				)
			}
		/>
	);
}

export default CustomDuotonePicker;
