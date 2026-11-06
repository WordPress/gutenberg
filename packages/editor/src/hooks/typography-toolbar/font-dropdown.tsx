import { __ } from '@wordpress/i18n';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import type { FontFamilyPreset } from '@wordpress/global-styles-engine';

const POPOVER_PROPS = {
	className: 'editor-typography-toolbar__font-popover',
	placement: 'bottom-start' as const,
};

/**
 * Lists the theme's fonts, each written in itself.
 *
 * @param props              Component props.
 * @param props.fontFamilies The theme's font family presets.
 * @param props.value        The slug of the font in use, if the block sets one.
 * @param props.defaultName  The font the block renders in when it sets none.
 * @param props.onChange     Called with the slug of the chosen font, or
 *                           undefined to follow the theme.
 */
export default function TypographyFontDropdown( {
	fontFamilies,
	value,
	defaultName,
	onChange,
}: {
	fontFamilies: FontFamilyPreset[];
	value?: string;
	defaultName?: string;
	onChange: ( slug?: string ) => void;
} ) {
	const active = fontFamilies.find( ( preset ) => preset.slug === value );

	return (
		<ToolbarGroup>
			<ToolbarItem>
				{ ( toggleProps ) => (
					<DropdownMenu
						className="editor-typography-toolbar__font"
						icon={ null }
						label={ __( 'Font' ) }
						text={ active?.name ?? defaultName ?? __( 'Font' ) }
						popoverProps={ POPOVER_PROPS }
						toggleProps={ toggleProps }
					>
						{ ( { onClose } ) => (
							<MenuGroup>
								<MenuItem
									role="menuitemradio"
									isSelected={ ! active }
									onClick={ () => {
										onChange( undefined );
										onClose();
									} }
								>
									{ __( 'Default' ) }
								</MenuItem>
								{ fontFamilies.map( ( preset ) => (
									<MenuItem
										key={ preset.slug }
										role="menuitemradio"
										isSelected={ preset.slug === value }
										style={ {
											fontFamily: preset.fontFamily,
										} }
										onClick={ () => {
											onChange( preset.slug );
											onClose();
										} }
									>
										{ preset.name }
									</MenuItem>
								) ) }
							</MenuGroup>
						) }
					</DropdownMenu>
				) }
			</ToolbarItem>
		</ToolbarGroup>
	);
}
