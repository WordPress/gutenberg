/**
 * External dependencies
 */
import { isEqual } from 'lodash';

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
import { getDefaultColors, getGradientFromCSSColors } from './utils';

function DuotonePicker( {
	clearable = true,
	colorPalette,
	duotonePalette,
	disableCustomColors,
	disableCustomDuotone,
	value,
	onChange,
} ) {
	const [ defaultDark, defaultLight ] = useMemo(
		() => getDefaultColors( colorPalette ),
		[ colorPalette ]
	);

	return (
		<CircularOptionPicker
			options={ duotonePalette.map( ( { colors, slug, name } ) => {
				const style = {
					background: getGradientFromCSSColors( colors, '135deg' ),
					color: 'transparent',
				};
				const tooltipText =
					name ??
					sprintf(
						// translators: %s: duotone code e.g: "dark-grayscale" or "7f7f7f-ffffff".
						__( 'Duotone code: %s' ),
						slug
					);
				const label = name
					? sprintf(
							// translators: %s: The name of the option e.g: "Dark grayscale".
							__( 'Duotone: %s' ),
							name
					  )
					: tooltipText;
				const isSelected = isEqual( colors, value );

				return (
					<CircularOptionPicker.Option
						key={ slug }
						value={ colors }
						isSelected={ isSelected }
						aria-label={ label }
						tooltipText={ tooltipText }
						style={ style }
						onClick={ () => {
							onChange( isSelected ? undefined : colors );
						} }
					/>
				);
			} ) }
			actions={
				!! clearable && (
					<CircularOptionPicker.ButtonAction
						onClick={ () => onChange( undefined ) }
					>
						{ __( 'Clear' ) }
					</CircularOptionPicker.ButtonAction>
				)
			}
		>
			{ ! disableCustomColors && ! disableCustomDuotone && (
				<CustomDuotoneBar value={ value } onChange={ onChange } />
			) }
			{ ! disableCustomDuotone && (
				<ColorListPicker
					labels={ [ __( 'Shadows' ), __( 'Highlights' ) ] }
					colors={ colorPalette }
					value={ value }
					disableCustomColors={ disableCustomColors }
					enableAlpha
					onChange={ ( newColors ) => {
						if ( ! newColors[ 0 ] ) {
							newColors[ 0 ] = defaultDark;
						}
						if ( ! newColors[ 1 ] ) {
							newColors[ 1 ] = defaultLight;
						}
						const newValue =
							newColors.length >= 2 ? newColors : undefined;
						onChange( newValue );
					} }
				/>
			) }
		</CircularOptionPicker>
	);
}

export default DuotonePicker;
