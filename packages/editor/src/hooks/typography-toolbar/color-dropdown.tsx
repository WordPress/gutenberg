import { __ } from '@wordpress/i18n';
import {
	ColorPalette,
	Dropdown,
	ToolbarButton,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import { Icon, textColor as textColorIcon } from '@wordpress/icons';

const POPOVER_PROPS = {
	className: 'editor-typography-toolbar__color-popover',
	placement: 'bottom-start' as const,
};

type ColorOption = { slug?: string; name?: string; color: string };

/**
 * Offers the theme's colours for the block's text, the way the inline text
 * colour does, with the icon's bar carrying the colour in use.
 *
 * @param props          Component props.
 * @param props.colors   The theme's colour presets.
 * @param props.value    The colour in use, as a CSS colour.
 * @param props.onChange Called with the chosen colour and the preset it came
 *                       from, or nothing at all to clear it.
 */
export default function TypographyColorDropdown( {
	colors,
	value,
	onChange,
}: {
	colors: ColorOption[];
	value?: string;
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
								label={ __( 'Text color' ) }
								icon={
									<Icon
										icon={ textColorIcon }
										style={ { color: value } }
									/>
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
