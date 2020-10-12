/**
 * WordPress dependencies
 */
import {
	BaseControl,
	CircularOptionPicker,
	Dropdown,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { noFilter } from '@wordpress/icons';
import { DOWN } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import {
	getGradientFromCSSColors,
	getGradientFromValues,
	getValuesFromHexColors,
} from './utils';

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
									<span
										className="block-editor-duotone-toolbar-icon"
										style={ {
											background: getGradientFromValues(
												value.values
											),
										} }
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
				<BaseControl>
					<BaseControl.VisualLabel>
						{ __( 'Duotone Presets' ) }
					</BaseControl.VisualLabel>
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
						<div />
					</CircularOptionPicker>
				</BaseControl>
			) }
		/>
	);
}

export default DuotoneToolbar;
