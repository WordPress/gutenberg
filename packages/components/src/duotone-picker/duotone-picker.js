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
	const options = duotonePalette.map( ( { colors, slug, name } ) => {
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
	} );

	// Add a disable duotone option.
	const disableOption = (
		<CircularOptionPicker.Option
			key={ 'unset' }
			value={ 'unset' }
			isSelected={ value === 'unset' }
			aria-label={ __( 'Disable duotone' ) }
			tooltipText={ __( 'Disable duotone' ) }
			style={ {
				background: '#FFF url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'><path d=\'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM3 12c0-5 4-9 9-9 2.2 0 4.3.8 5.8 2.2L5.2 17.8C3.8 16.3 3 14.2 3 12zm9 9c-2.4 0-4.5-.9-6.2-2.4L18.6 5.8C20.1 7.5 21 9.6 21 12c0 5-4 9-9 9z\' fill-rule=\'evenodd\' clip-rule=\'evenodd\' /></svg>" )',
				color: 'transparent',
			} }
			onClick={ () => {
				onChange( value === 'unset' ? undefined : 'unset' );
			} }
		/>
	);

	return (
		<CircularOptionPicker
			options={ [ disableOption, ...options ] }
			actions={
				<div>
					<CircularOptionPicker.ButtonAction
						onClick={ () => onChange( undefined ) }
					>
						{ __( 'Clear' ) }
					</CircularOptionPicker.ButtonAction>
				</div>
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
