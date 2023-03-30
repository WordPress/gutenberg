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
import ColorListPicker from './color-list-picker';
import CircularOptionPicker from '../circular-option-picker';
import { VStack } from '../v-stack';

import CustomDuotoneBar from './custom-duotone-bar';
import { getDefaultColors, getGradientFromCSSColors } from './utils';
import { Spacer } from '../spacer';
import type { DuotonePickerProps } from './types';

/**
 * ```jsx
 * import { DuotonePicker, DuotoneSwatch } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const DUOTONE_PALETTE = [
 * 	{ colors: [ '#8c00b7', '#fcff41' ], name: 'Purple and yellow', slug: 'purple-yellow' },
 * 	{ colors: [ '#000097', '#ff4747' ], name: 'Blue and red', slug: 'blue-red' },
 * ];
 *
 * const COLOR_PALETTE = [
 * 	{ color: '#ff4747', name: 'Red', slug: 'red' },
 * 	{ color: '#fcff41', name: 'Yellow', slug: 'yellow' },
 * 	{ color: '#000097', name: 'Blue', slug: 'blue' },
 * 	{ color: '#8c00b7', name: 'Purple', slug: 'purple' },
 * ];
 *
 * const Example = () => {
 * 	const [ duotone, setDuotone ] = useState( [ '#000000', '#ffffff' ] );
 * 	return (
 * 		<>
 * 			<DuotonePicker
 * 				duotonePalette={ DUOTONE_PALETTE }
 * 				colorPalette={ COLOR_PALETTE }
 * 				value={ duotone }
 * 				onChange={ setDuotone }
 * 			/>
 * 			<DuotoneSwatch values={ duotone } />
 * 		</>
 * 	);
 * };
 * ```
 */
function DuotonePicker( {
	clearable = true,
	unsetable = true,
	colorPalette,
	duotonePalette,
	disableCustomColors,
	disableCustomDuotone,
	value,
	onChange,
}: DuotonePickerProps ) {
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
								// @ts-expect-error TODO: The color arrays for a DuotonePicker should be a tuple of two colors,
								// but it's currently typed as a string[].
								// See also https://github.com/WordPress/gutenberg/pull/49060#discussion_r1136951035
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
