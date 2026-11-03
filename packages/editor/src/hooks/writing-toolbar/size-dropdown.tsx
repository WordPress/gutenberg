import { __ } from '@wordpress/i18n';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	ToolbarGroup,
	ToolbarItem,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import type { FontSizePreset } from '@wordpress/global-styles-engine';
import {
	MAX_CUSTOM_FONT_SIZE,
	MIN_CUSTOM_FONT_SIZE,
	clampCustomFontSize,
	parseFontSizeToPx,
} from './utils';

const POPOVER_PROPS = {
	className: 'editor-writing-toolbar__size-popover',
	placement: 'bottom-start' as const,
};

/**
 * Lists the sizes the theme offers, shown at their real size with the number
 * beside them, and a box for typing a size of your own.
 *
 * @param props                Component props.
 * @param props.fontSizes      The theme's font size presets.
 * @param props.value          The slug of the preset in use, if the block sets
 *                             one.
 * @param props.customSize     The size the block sets of its own.
 * @param props.onSelectPreset Called with the slug of the chosen preset, or
 *                             undefined to follow the theme.
 * @param props.onSetCustom    Called with a size in pixels.
 */
export default function WritingSizeDropdown( {
	fontSizes,
	value,
	customSize,
	onSelectPreset,
	onSetCustom,
}: {
	fontSizes: FontSizePreset[];
	value?: string;
	customSize?: string;
	onSelectPreset: ( slug?: string ) => void;
	onSetCustom: ( size: number ) => void;
} ) {
	const active = fontSizes.find( ( preset ) => preset.slug === value );
	const customPx = parseFontSizeToPx( customSize );

	// An asterisk marks a size of your own, as the experiment's size box does.
	let text: string = __( 'Size' );
	if ( active ) {
		text = active.name;
	} else if ( customPx !== undefined ) {
		text = `${ customPx }*`;
	}

	return (
		<ToolbarGroup>
			<ToolbarItem>
				{ ( toggleProps ) => (
					<DropdownMenu
						className="editor-writing-toolbar__size"
						icon={ null }
						label={ __( 'Size' ) }
						text={ text }
						popoverProps={ POPOVER_PROPS }
						toggleProps={ toggleProps }
					>
						{ ( { onClose } ) => (
							<>
								<div className="editor-writing-toolbar__custom-size">
									<NumberControl
										label={ __( 'Custom size' ) }
										value={ customPx }
										min={ MIN_CUSTOM_FONT_SIZE }
										max={ MAX_CUSTOM_FONT_SIZE }
										isPressEnterToChange
										onChange={ ( next ) => {
											const size =
												clampCustomFontSize( next );
											if ( size !== undefined ) {
												onSetCustom( size );
												onClose();
											}
										} }
									/>
								</div>
								<MenuGroup>
									<MenuItem
										role="menuitemradio"
										isSelected={
											! active && customPx === undefined
										}
										onClick={ () => {
											onSelectPreset( undefined );
											onClose();
										} }
									>
										{ __( 'Theme size' ) }
									</MenuItem>
									{ fontSizes.map( ( preset ) => (
										<MenuItem
											key={ preset.slug }
											role="menuitemradio"
											isSelected={ preset.slug === value }
											style={ {
												fontSize:
													preset.size ?? undefined,
											} }
											suffix={
												<span className="editor-writing-toolbar__size-value">
													{ parseFontSizeToPx(
														preset.size
													) }
												</span>
											}
											onClick={ () => {
												onSelectPreset( preset.slug );
												onClose();
											} }
										>
											{ preset.name }
										</MenuItem>
									) ) }
								</MenuGroup>
							</>
						) }
					</DropdownMenu>
				) }
			</ToolbarItem>
		</ToolbarGroup>
	);
}
