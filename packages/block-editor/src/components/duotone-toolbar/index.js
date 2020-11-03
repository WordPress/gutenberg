/**
 * WordPress dependencies
 */
import {
	Button,
	CircularOptionPicker,
	Icon,
	ToolbarButton,
	ToolbarGroup,
	ColorPalette,
	Popover,
} from '@wordpress/components';
import { useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { noFilter } from '@wordpress/icons';
import { DOWN } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import {
	getGradientFromCSSColors,
	getGradientFromValues,
	getHexColorsFromValues,
	getValuesFromHexColors,
	toBrightness,
} from './utils';

function getDefaultColors( palette ) {
	// A default dark and light color are required.
	if ( ! palette || palette.length < 2 ) return [ '#000', '#fff' ];

	return palette
		.map( ( { color } ) => ( {
			color,
			brightness: toBrightness( color ),
		} ) )
		.reduce(
			( [ min, max ], current ) => {
				return [
					current.brightness <= min.brightness ? current : min,
					current.brightness >= max.brightness ? current : max,
				];
			},
			[ { brightness: 1 }, { brightness: 0 } ]
		)
		.map( ( { color } ) => color );
}

function Swatch( { fill } ) {
	return (
		<span
			className="block-editor-duotone-toolbar__swatch"
			style={ { background: fill } }
		/>
	);
}

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

function DuotoneToolbar( { value, onChange, duotonePalette, colorPalette } ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const onToggle = () => {
		setIsOpen( ( prev ) => ! prev );
	};
	const openOnArrowDown = ( event ) => {
		if ( ! isOpen && event.keyCode === DOWN ) {
			event.preventDefault();
			event.stopPropagation();
			onToggle();
		}
	};
	return (
		<>
			<ToolbarGroup>
				<ToolbarButton
					showTooltip
					onClick={ onToggle }
					aria-haspopup="true"
					aria-expanded={ isOpen }
					onKeyDown={ openOnArrowDown }
					label={ __( 'Change image duotone filter' ) }
					icon={
						value ? (
							<Swatch
								fill={ getGradientFromValues( value.values ) }
							/>
						) : (
							noFilter
						)
					}
				/>
			</ToolbarGroup>
			{ isOpen && (
				<Popover
					className="block-editor-duotone-toolbar__popover"
					headerTitle={ __( 'Duotone Presets' ) }
				>
					<span className="block-editor-duotone-toolbar__label">
						{ __( 'Duotone Presets' ) }
					</span>
					<CircularOptionPicker
						options={ duotonePalette.map( ( option ) => {
							const isSelected = option.slug === value?.slug;
							const style = {
								background: getGradientFromCSSColors(
									option.colors
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
											// TODO: Should values be precomputed here or computed in the PHP instead?
											values: getValuesFromHexColors(
												option.colors
											),
											slug: option.slug,
										};
										onChange(
											isSelected ? undefined : newValue
										);
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
						<CustomColorPicker
							colors={ getHexColorsFromValues( value?.values ) }
							palette={ colorPalette }
							onChange={ ( newColors ) =>
								onChange(
									newColors.length >= 2
										? {
												values: getValuesFromHexColors(
													newColors
												),
												slug: `custom-${ newColors
													.map( ( hex ) =>
														hex
															.slice( 1 )
															.toLowerCase()
													)
													.join( '-' ) }`,
										  }
										: undefined
								)
							}
						/>
					</CircularOptionPicker>
					<div className="block-editor-duotone-toolbar__description">
						{ __(
							'The duotone filter creates a two-color version of your image, where you choose the colors.'
						) }
					</div>
				</Popover>
			) }
		</>
	);
}

export default DuotoneToolbar;
