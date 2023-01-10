/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

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
import { VStack } from '../v-stack';

import CustomDuotoneBar from './custom-duotone-bar';
import { getDefaultColors, getGradientFromCSSColors } from './utils';
import { Spacer } from '../spacer';

function DuotonePicker( {
	clearable = true,
	unsetable = true,
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

	const isUnset = value === 'unset';

	const unsetOption = (
		<CircularOptionPicker.Option
			key="unset"
			value="unset"
			isSelected={ isUnset }
			tooltipText={ __( 'Unset' ) }
			className="components-duotone-picker__color-indicator"
			onClick={ () => {
				onChange( isUnset ? undefined : 'unset' );
			} }
		/>
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
		const isSelected = fastDeepEqual( colors, value );

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

	return (
		<CircularOptionPicker
			options={ unsetable ? [ unsetOption, ...options ] : options }
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
			<Spacer paddingTop={ 4 }>
				<VStack spacing={ 3 }>
					{ ! disableCustomColors && ! disableCustomDuotone && (
						<CustomDuotoneBar
							value={ isUnset ? undefined : value }
							onChange={ onChange }
						/>
					) }
					{ ! disableCustomDuotone && (
						<ColorListPicker
							labels={ [ __( 'Shadows' ), __( 'Highlights' ) ] }
							colors={ colorPalette }
							value={ isUnset ? undefined : value }
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
									newColors.length >= 2
										? newColors
										: undefined;
								onChange( newValue );
							} }
						/>
					) }
				</VStack>
			</Spacer>
		</CircularOptionPicker>
	);
}

export default DuotonePicker;
