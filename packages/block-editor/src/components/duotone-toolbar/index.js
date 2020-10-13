/**
 * WordPress dependencies
 */
import {
	Button,
	CircularOptionPicker,
	Dropdown,
	Icon,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { noFilter } from '@wordpress/icons';
import { DOWN } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { ColorPalette } from '..';
import {
	getGradientFromCSSColors,
	getGradientFromValues,
	getHexColorsFromValues,
	getValuesFromHexColors,
} from './utils';

function Swatch( { fill } ) {
	return (
		<span
			className="block-editor-duotone-toolbar__swatch"
			style={ { background: fill } }
		/>
	);
}

function CustomColorOption( { label, color, onChange } ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const icon = color ? <Swatch fill={ color } /> : <Icon icon={ noFilter } />;
	return (
		<div className="block-editor-duotone-custom-color">
			<Button
				className="block-editor-duotone-custom-color__button"
				icon={ icon }
				onClick={ () => setIsOpen( ( prev ) => ! prev ) }
			>
				{ label }
			</Button>
			{ isOpen && <ColorPalette onChange={ onChange } /> }
		</div>
	);
}

function CustomColorPicker( { colors, onChange } ) {
	return (
		<>
			<CustomColorOption
				label={ __( 'Dark Color' ) }
				color={ colors?.[ 0 ] }
				onChange={ ( newColor ) => {
					const newColors = colors.slice();
					newColors[ 0 ] = newColor;
					onChange( newColors );
				} }
			/>
			<CustomColorOption
				label={ __( 'Light Color' ) }
				color={ colors?.[ colors.length - 1 ] }
				onChange={ ( newColor ) => {
					const newColors = colors.slice();
					newColors[ colors.length - 1 ] = newColor;
					onChange( newColors );
				} }
			/>
		</>
	);
}

function DuotoneToolbar( { value, onChange, options } ) {
	return (
		<Dropdown
			position="bottom right"
			renderToggle={ ( { onToggle, isOpen } ) => {
				const openOnArrowDown = ( event ) => {
					if ( ! isOpen && event.keyCode === DOWN ) {
						event.preventDefault();
						event.stopPropagation();
						onToggle();
					}
				};

				return (
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
										fill={ getGradientFromValues(
											value.values
										) }
									/>
								) : (
									noFilter
								)
							}
						/>
					</ToolbarGroup>
				);
			} }
			renderContent={ () => (
				<div className="block-editor-duotone-toolbar__popover">
					<span className="block-editor-duotone-toolbar__label">
						{ __( 'Duotone Presets' ) }
					</span>
					<CircularOptionPicker
						options={ options.map( ( option ) => {
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
									tooltipText={ option.name || code }
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
				</div>
			) }
		/>
	);
}

export default DuotoneToolbar;
