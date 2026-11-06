import {
	ColorPalette,
	Dropdown,
	ToolbarButton,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import { Icon } from '@wordpress/icons';

const POPOVER_PROPS = {
	className: 'editor-typography-toolbar__color-popover',
	placement: 'bottom-start' as const,
};

type ColorOption = { slug?: string; name?: string; color: string };

/**
 * Offers the theme's colours for the block's text, the way the inline text
 * colour does, with the icon's bar carrying the colour in use.
 *
 * @param props              Component props.
 * @param props.label        What the control is called.
 * @param props.icon         The glyph the bar sits under.
 * @param props.colors       The theme's colour presets.
 * @param props.value        The colour the block sets, as a CSS colour.
 * @param props.defaultColor The colour it renders in when it sets none.
 * @param props.onChange     Called with the chosen colour and the preset it
 *                           came from, or nothing at all to clear it.
 */
export default function TypographyColorDropdown( {
	label,
	icon,
	colors,
	value,
	defaultColor,
	onChange,
}: {
	label: string;
	icon: Parameters< typeof Icon >[ 0 ][ 'icon' ];
	colors: ColorOption[];
	value?: string;
	defaultColor?: string;
	onChange: ( color?: string, slug?: string ) => void;
} ) {
	return (
		<ToolbarGroup>
			<ToolbarItem>
				{ ( toggleProps ) => (
					<Dropdown
						popoverProps={ POPOVER_PROPS }
						renderToggle={ ( { isOpen, onToggle } ) => (
							<ToolbarButton
								{ ...toggleProps }
								onClick={ onToggle }
								aria-expanded={ isOpen }
								aria-haspopup="true"
								label={ label }
								icon={
									<span className="editor-typography-toolbar__color-icon">
										<Icon icon={ icon } />
										<span
											className="editor-typography-toolbar__color-bar"
											data-testid="typography-color-bar"
											style={ {
												// Nothing to show rather
												// than a colour the block
												// has not got.
												background:
													value ??
													defaultColor ??
													'transparent',
											} }
										/>
									</span>
								}
							/>
						) }
						renderContent={ () => (
							<ColorPalette
								colors={ colors }
								value={ value }
								onChange={ ( color, _index, slug ) =>
									onChange( color, slug )
								}
							/>
						) }
					/>
				) }
			</ToolbarItem>
		</ToolbarGroup>
	);
}
