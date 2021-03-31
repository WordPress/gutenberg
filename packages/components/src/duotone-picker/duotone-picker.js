/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ColorListPicker from '../color-list-picker';
import CircularOptionPicker from '../circular-option-picker';

import CustomDuotoneBar from './custom-duotone-bar';
import {
	getDefaultColors,
	getGradientFromCSSColors,
	getHexColorsFromValues,
	getValuesFromColors,
} from './utils';

function DuotonePicker( { colorPalette, duotonePalette, value, onChange } ) {
	const [ defaultDark, defaultLight ] = useMemo(
		() => getDefaultColors( colorPalette ),
		[ colorPalette ]
	);
	return (
		<CircularOptionPicker
			options={ duotonePalette.map( ( option ) => {
				const isSelected = option.slug === value?.slug;
				const style = {
					background: getGradientFromCSSColors(
						option.colors,
						'135deg'
					),
					color: 'transparent',
				};
				const code = sprintf(
					// translators: %s: duotone code e.g: "dark-grayscale" or "7f7f7f-ffffff".
					__( 'Duotone code: %s' ),
					option.slug
				);
				const label = sprintf(
					// translators: %s: The name of the option e.g: "Dark grayscale".
					__( 'Duotone: %s' ),
					option.name
				);

				return (
					<CircularOptionPicker.Option
						key={ option.slug }
						value={ option.slug }
						isSelected={ isSelected }
						tooltipText={ option.name ?? code }
						style={ style }
						onClick={ () => {
							const newValue = {
								values: getValuesFromColors( option.colors ),
								slug: option.slug,
							};
							onChange( isSelected ? undefined : newValue );
						} }
						aria-label={ option.name ? label : code }
					/>
				);
			} ) }
			actions={
				<CircularOptionPicker.ButtonAction
					onClick={ () => onChange( undefined ) }
				>
					{ __( 'Clear' ) }
				</CircularOptionPicker.ButtonAction>
			}
		>
			<CustomDuotoneBar value={ value } onChange={ onChange } />
			<ColorListPicker
				labels={ [ __( 'Shadows' ), __( 'Highlights' ) ] }
				colors={ colorPalette }
				value={ getHexColorsFromValues( value?.values ) }
				onChange={ ( newColors ) => {
					if ( ! newColors[ 0 ] ) {
						newColors[ 0 ] = defaultDark;
					}
					if ( ! newColors[ 1 ] ) {
						newColors[ 1 ] = defaultLight;
					}
					const newValue =
						newColors.length >= 2
							? {
									values: getValuesFromColors( newColors ),
							  }
							: undefined;
					onChange( newValue );
				} }
			/>
		</CircularOptionPicker>
	);
}

export default DuotonePicker;
