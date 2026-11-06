import {
	ColorPalette,
	Dropdown,
	ToolbarButton,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import type { ReactNode } from 'react';

const POPOVER_PROPS = {
	className: 'editor-typography-toolbar__color-popover',
	placement: 'bottom-start' as const,
};

type ColorOption = { slug?: string; name?: string; color: string };

/**
 * Offers the theme's colours for one of the block's own, showing the colour
 * in use through whatever indicator it is given.
 *
 * @param props          Component props.
 * @param props.label    What the control is called.
 * @param props.icon     The indicator showing the colour in use.
 * @param props.colors   The theme's colour presets.
 * @param props.value    The colour the block sets, as a CSS colour.
 * @param props.onChange Called with the chosen colour and the preset it came
 *                       from, or nothing at all to clear it.
 */
export default function TypographyColorDropdown( {
	label,
	icon,
	colors,
	value,
	onChange,
}: {
	label: string;
	icon: ReactNode;
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
								label={ label }
								icon={ icon }
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
