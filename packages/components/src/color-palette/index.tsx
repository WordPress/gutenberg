/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import a11yPlugin from 'colord/plugins/a11y';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Dropdown from '../dropdown';
import { ColorPicker } from '../color-picker';
import CircularOptionPicker from '../circular-option-picker';
import { VStack } from '../v-stack';
import { Flex, FlexItem } from '../flex';
import { Truncate } from '../truncate';
import { ColorHeading } from './styles';
import DropdownContentWrapper from '../dropdown/dropdown-content-wrapper';
import type {
	ColorObject,
	ColorPaletteProps,
	CustomColorPickerDropdownProps,
	MultiplePalettesProps,
	PaletteObject,
	SinglePaletteProps,
} from './types';
import type { WordPressComponentProps } from '../ui/context';
import type { DropdownProps } from '../dropdown/types';

extend( [ namesPlugin, a11yPlugin ] );

function SinglePalette( {
	className,
	clearColor,
	colors,
	onChange,
	value,
	actions,
}: SinglePaletteProps ) {
	const colorOptions = useMemo( () => {
		return colors.map( ( { color, name }, index ) => {
			const colordColor = colord( color );
			const isSelected = value === color;

			return (
				<CircularOptionPicker.Option
					key={ `${ color }-${ index }` }
					isSelected={ isSelected }
					selectedIconProps={
						isSelected
							? {
									fill:
										colordColor.contrast() >
										colordColor.contrast( '#000' )
											? '#fff'
											: '#000',
							  }
							: {}
					}
					tooltipText={
						name ||
						// translators: %s: color hex code e.g: "#f00".
						sprintf( __( 'Color code: %s' ), color )
					}
					style={ { backgroundColor: color, color } }
					onClick={
						isSelected ? clearColor : () => onChange( color, index )
					}
					aria-label={
						name
							? // translators: %s: The name of the color e.g: "vivid red".
							  sprintf( __( 'Color: %s' ), name )
							: // translators: %s: color hex code e.g: "#f00".
							  sprintf( __( 'Color code: %s' ), color )
					}
				/>
			);
		} );
	}, [ colors, value, onChange, clearColor ] );

	return (
		<CircularOptionPicker
			className={ className }
			options={ colorOptions }
			actions={ actions }
		/>
	);
}

function MultiplePalettes( {
	className,
	clearColor,
	colors,
	onChange,
	value,
	actions,
}: MultiplePalettesProps ) {
	if ( colors.length === 0 ) {
		return null;
	}

	return (
		<VStack spacing={ 3 } className={ className }>
			{ colors.map( ( { name, colors: colorPalette }, index ) => {
				return (
					<VStack spacing={ 2 } key={ index }>
						<ColorHeading>{ name }</ColorHeading>
						<SinglePalette
							clearColor={ clearColor }
							colors={ colorPalette }
							onChange={ ( newColor ) =>
								onChange( newColor, index )
							}
							value={ value }
							actions={
								colors.length === index + 1 ? actions : null
							}
						/>
					</VStack>
				);
			} ) }
		</VStack>
	);
}

export function CustomColorPickerDropdown( {
	isRenderedInSidebar,
	popoverProps: receivedPopoverProps,
	...props
}: CustomColorPickerDropdownProps ) {
	const popoverProps = useMemo< DropdownProps[ 'popoverProps' ] >(
		() => ( {
			shift: true,
			...( isRenderedInSidebar
				? {
						// When in the sidebar: open to the left (stacking),
						// leaving the same gap as the parent popover.
						placement: 'left-start',
						offset: 34,
				  }
				: {
						// Default behavior: open below the anchor
						placement: 'bottom',
						offset: 8,
				  } ),
			...receivedPopoverProps,
		} ),
		[ isRenderedInSidebar, receivedPopoverProps ]
	);

	return (
		<Dropdown
			contentClassName="components-color-palette__custom-color-dropdown-content"
			popoverProps={ popoverProps }
			{ ...props }
		/>
	);
}

export const extractColorNameFromCurrentValue = (
	currentValue?: ColorPaletteProps[ 'value' ],
	colors: ColorPaletteProps[ 'colors' ] = [],
	showMultiplePalettes: boolean = false
) => {
	if ( ! currentValue ) {
		return '';
	}

	const currentValueIsCssVariable = /^var\(/.test( currentValue );
	const normalizedCurrentValue = currentValueIsCssVariable
		? currentValue
		: colord( currentValue ).toHex();

	// Normalize format of `colors` to simplify the following loop
	type normalizedPaletteObject = { colors: ColorObject[] };
	const colorPalettes: normalizedPaletteObject[] = showMultiplePalettes
		? ( colors as PaletteObject[] )
		: [ { colors: colors as ColorObject[] } ];
	for ( const { colors: paletteColors } of colorPalettes ) {
		for ( const { name: colorName, color: colorValue } of paletteColors ) {
			const normalizedColorValue = currentValueIsCssVariable
				? colorValue
				: colord( colorValue ).toHex();

			if ( normalizedCurrentValue === normalizedColorValue ) {
				return colorName;
			}
		}
	}

	// translators: shown when the user has picked a custom color (i.e not in the palette of colors).
	return __( 'Custom' );
};

export const showTransparentBackground = ( currentValue?: string ) => {
	if ( typeof currentValue === 'undefined' ) {
		return true;
	}
	return colord( currentValue ).alpha() === 0;
};

const areColorsMultiplePalette = (
	colors: NonNullable< ColorPaletteProps[ 'colors' ] >
): colors is PaletteObject[] => {
	return colors.every( ( colorObj ) =>
		Array.isArray( ( colorObj as PaletteObject ).colors )
	);
};

function UnforwardedColorPalette(
	props: WordPressComponentProps< ColorPaletteProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const {
		clearable = true,
		colors = [],
		disableCustomColors = false,
		enableAlpha = false,
		onChange,
		value,
		__experimentalIsRenderedInSidebar = false,
		...otherProps
	} = props;
	const clearColor = useCallback( () => onChange( undefined ), [ onChange ] );

	const hasMultipleColorOrigins =
		colors.length > 0 &&
		( colors as PaletteObject[] )[ 0 ].colors !== undefined;
	const buttonLabelName = useMemo(
		() =>
			extractColorNameFromCurrentValue(
				value,
				colors,
				hasMultipleColorOrigins
			),
		[ value, colors, hasMultipleColorOrigins ]
	);

	// Make sure that the `colors` array has a valid format.
	if (
		colors.length > 0 &&
		hasMultipleColorOrigins !== areColorsMultiplePalette( colors )
	) {
		// eslint-disable-next-line no-console
		console.warn(
			'wp.components.ColorPalette: please specify a valid format for the `colors` prop. '
		);
		return null;
	}

	const renderCustomColorPicker = () => (
		<DropdownContentWrapper paddingSize="none">
			<ColorPicker
				color={ value }
				onChange={ ( color ) => onChange( color ) }
				enableAlpha={ enableAlpha }
			/>
		</DropdownContentWrapper>
	);

	const colordColor = colord( value ?? '' );

	const valueWithoutLeadingHash = value?.startsWith( '#' )
		? value.substring( 1 )
		: value ?? '';

	const customColorAccessibleLabel = !! valueWithoutLeadingHash
		? sprintf(
				// translators: %1$s: The name of the color e.g: "vivid red". %2$s: The color's hex code e.g: "#f00".
				__(
					'Custom color picker. The currently selected color is called "%1$s" and has a value of "%2$s".'
				),
				buttonLabelName,
				valueWithoutLeadingHash
		  )
		: __( 'Custom color picker.' );

	const paletteCommonProps = {
		clearable,
		clearColor,
		onChange,
		value,
		actions: !! clearable && (
			<CircularOptionPicker.ButtonAction onClick={ clearColor }>
				{ __( 'Clear' ) }
			</CircularOptionPicker.ButtonAction>
		),
	};

	return (
		<VStack spacing={ 3 } ref={ forwardedRef } { ...otherProps }>
			{ ! disableCustomColors && (
				<CustomColorPickerDropdown
					isRenderedInSidebar={ __experimentalIsRenderedInSidebar }
					renderContent={ renderCustomColorPicker }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Flex
							as={ 'button' }
							justify="space-between"
							align="flex-start"
							className="components-color-palette__custom-color"
							aria-expanded={ isOpen }
							aria-haspopup="true"
							onClick={ onToggle }
							aria-label={ customColorAccessibleLabel }
							style={
								showTransparentBackground( value )
									? { color: '#000' }
									: {
											background: value,
											color:
												colordColor.contrast() >
												colordColor.contrast( '#000' )
													? '#fff'
													: '#000',
									  }
							}
						>
							<FlexItem
								isBlock
								as={ Truncate }
								className="components-color-palette__custom-color-name"
							>
								{ buttonLabelName }
							</FlexItem>
							<FlexItem
								as="span"
								className="components-color-palette__custom-color-value"
							>
								{ valueWithoutLeadingHash }
							</FlexItem>
						</Flex>
					) }
				/>
			) }
			{ hasMultipleColorOrigins ? (
				<MultiplePalettes
					{ ...paletteCommonProps }
					colors={ colors as PaletteObject[] }
				/>
			) : (
				<SinglePalette
					{ ...paletteCommonProps }
					colors={ colors as ColorObject[] }
				/>
			) }
		</VStack>
	);
}

/**
 * Allows the user to pick a color from a list of pre-defined color entries.
 *
 * ```jsx
 * import { ColorPalette } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyColorPalette = () => {
 *   const [ color, setColor ] = useState ( '#f00' )
 *   const colors = [
 *     { name: 'red', color: '#f00' },
 *     { name: 'white', color: '#fff' },
 *     { name: 'blue', color: '#00f' },
 *   ];
 *   return (
 *     <ColorPalette
 *       colors={ colors }
 *       value={ color }
 *       onChange={ ( color ) => setColor( color ) }
 *     />
 *   );
 * } );
 * ```
 */
export const ColorPalette = forwardRef( UnforwardedColorPalette );

export default ColorPalette;
