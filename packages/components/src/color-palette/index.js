// @ts-nocheck
/**
 * External dependencies
 */
import { map } from 'lodash';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import a11yPlugin from 'colord/plugins/a11y';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';

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

extend( [ namesPlugin, a11yPlugin ] );

function SinglePalette( {
	className,
	clearColor,
	colors,
	onChange,
	value,
	actions,
} ) {
	const colorOptions = useMemo( () => {
		return map( colors, ( { color, name } ) => {
			const colordColor = colord( color );

			return (
				<CircularOptionPicker.Option
					key={ color }
					isSelected={ value === color }
					selectedIconProps={
						value === color
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
						value === color ? clearColor : () => onChange( color )
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
} ) {
	return (
		<VStack spacing={ 3 } className={ className }>
			{ colors.map( ( { name, colors: colorPalette }, index ) => {
				return (
					<VStack spacing={ 2 } key={ index }>
						<ColorHeading>{ name }</ColorHeading>
						<SinglePalette
							clearColor={ clearColor }
							colors={ colorPalette }
							onChange={ onChange }
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

export function CustomColorPickerDropdown( { isRenderedInSidebar, ...props } ) {
	return (
		<Dropdown
			contentClassName={ classnames(
				'components-color-palette__custom-color-dropdown-content',
				{
					'is-rendered-in-sidebar': isRenderedInSidebar,
				}
			) }
			{ ...props }
		/>
	);
}

const extractColorNameFromCurrentValue = (
	currentValue,
	colors = [],
	showMultiplePalettes = false
) => {
	if ( ! currentValue ) {
		return '';
	}

	let colorNameToReturn;

	if ( showMultiplePalettes ) {
		for ( const {
			name: colorPaletteName,
			colors: colorPaletteColors,
		} of colors ) {
			for ( const {
				name: colorName,
				color: colorValue,
			} of colorPaletteColors ) {
				if (
					colord( currentValue ).toHex() ===
					colord( colorValue ).toHex()
				) {
					return sprintf(
						// translators: %1$s: The name of the color e.g: "vivid red"; %2$s: the color palette name (e.g. 'Theme', 'Default', 'Custom'...).
						__( '%1$s (%2$s)' ),
						colorName,
						colorPaletteName
					);
				}
			}
		}
	} else {
		for ( const { name: colorName, color: colorValue } of colors ) {
			/* eslint-disable @wordpress/i18n-no-placeholders-only */
			if (
				colord( currentValue ).toHex() === colord( colorValue ).toHex()
			) {
				// translators: %s: The name of the color e.g: "vivid red".
				return sprintf( __( '%s' ), colorName );
			}
			/* eslint-enable @wordpress/i18n-no-placeholders-only */
		}
	}

	// translators: shown when the user has picked a custom color (i.e not in the palette of colors).
	return colorNameToReturn ?? __( 'Custom' );
};

export default function ColorPalette( {
	clearable = true,
	className,
	colors,
	disableCustomColors = false,
	enableAlpha,
	onChange,
	value,
	__experimentalHasMultipleOrigins = false,
	__experimentalIsRenderedInSidebar = false,
} ) {
	const clearColor = useCallback( () => onChange( undefined ), [ onChange ] );
	const showMultiplePalettes =
		__experimentalHasMultipleOrigins && colors?.length;
	const Component = showMultiplePalettes ? MultiplePalettes : SinglePalette;

	const renderCustomColorPicker = () => (
		<ColorPicker
			color={ value }
			onChange={ ( color ) => onChange( color ) }
			enableAlpha={ enableAlpha }
		/>
	);

	let dropdownPosition;
	if ( __experimentalIsRenderedInSidebar ) {
		dropdownPosition = 'bottom left';
	}

	const colordColor = colord( value );

	const buttonLabelValue = value?.startsWith( '#' )
		? value.substring( 1 )
		: value ?? '';
	const buttonLabelName = useMemo(
		() =>
			extractColorNameFromCurrentValue(
				value,
				colors,
				showMultiplePalettes
			),
		[ value, colors, showMultiplePalettes ]
	);

	return (
		<VStack spacing={ 3 } className={ className }>
			{ ! disableCustomColors && (
				<CustomColorPickerDropdown
					position={ dropdownPosition }
					isRenderedInSidebar={ __experimentalIsRenderedInSidebar }
					renderContent={ renderCustomColorPicker }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Flex
							as={ 'button' }
							justify="space-between"
							className="components-color-palette__custom-color"
							aria-expanded={ isOpen }
							aria-haspopup="true"
							onClick={ onToggle }
							aria-label={ __( 'Custom color picker' ) }
							style={ {
								background: value,
								color:
									colordColor.contrast() >
									colordColor.contrast( '#000' )
										? '#fff'
										: '#000',
							} }
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
								{ buttonLabelValue }
							</FlexItem>
						</Flex>
					) }
				/>
			) }
			<Component
				clearable={ clearable }
				clearColor={ clearColor }
				colors={ colors }
				onChange={ onChange }
				value={ value }
				actions={
					!! clearable && (
						<CircularOptionPicker.ButtonAction
							onClick={ clearColor }
						>
							{ __( 'Clear' ) }
						</CircularOptionPicker.ButtonAction>
					)
				}
			/>
		</VStack>
	);
}
