import { __, sprintf } from '@wordpress/i18n';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	ToolbarGroup,
	ToolbarItem,
	RangeControl,
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
	className: 'editor-typography-toolbar__size-popover',
	placement: 'bottom-start' as const,
};

/**
 * Names a theme size by its number, the way a word processor's size box does.
 * A fluid size has no single number to show, so it keeps its name.
 *
 * @param preset A font size preset.
 *
 * @return What to call the size.
 */
function getSizeLabel( preset: FontSizePreset ): string {
	const px = parseFontSizeToPx( preset.size );
	// A theme's rem size lands on a fraction of a pixel, which is no use as a
	// label, and the size box only takes whole pixels anyway.
	return px === undefined ? preset.name : String( Math.round( px ) );
}

/**
 * Lists the sizes the theme offers by their number, each shown at its real
 * size, and a box for typing a size of your own.
 *
 * @param props                Component props.
 * @param props.fontSizes      The theme's font size presets.
 * @param props.value          The slug of the preset in use, if the block sets
 *                             one.
 * @param props.customSize     The size the block sets of its own.
 * @param props.defaultSize    The size the block renders at when it sets none.
 * @param props.onSelectPreset Called with the slug of the chosen preset, or
 *                             undefined to follow the theme.
 * @param props.onSetCustom    Called with a size in pixels.
 */
export default function TypographySizeDropdown( {
	fontSizes,
	value,
	customSize,
	defaultSize,
	onSelectPreset,
	onSetCustom,
}: {
	fontSizes: FontSizePreset[];
	value?: string;
	customSize?: string;
	defaultSize?: string;
	onSelectPreset: ( slug?: string ) => void;
	onSetCustom: ( size: number ) => void;
} ) {
	const active = fontSizes.find( ( preset ) => preset.slug === value );
	const customPx = parseFontSizeToPx( customSize );
	const defaultPx = parseFontSizeToPx( defaultSize );

	// An asterisk marks a size of your own, as the experiment's size box does.
	let text: string = __( 'Size' );
	if ( active ) {
		text = getSizeLabel( active );
	} else if ( customPx !== undefined ) {
		text = `${ customPx }*`;
	} else if ( defaultPx !== undefined ) {
		text = String( Math.round( defaultPx ) );
	}

	// Naming the default by the size it stands for saves reading the toolbar
	// to find out what following the theme actually gives you.
	const defaultLabel =
		defaultPx === undefined
			? __( 'Default' )
			: sprintf(
					/* translators: %d: a font size in pixels, e.g. 22. */
					__( '%d - default' ),
					Math.round( defaultPx )
				);

	return (
		<ToolbarGroup>
			<ToolbarItem>
				{ ( toggleProps ) => (
					<DropdownMenu
						className="editor-typography-toolbar__size"
						icon={ null }
						label={ __( 'Size' ) }
						text={ text }
						popoverProps={ POPOVER_PROPS }
						toggleProps={ toggleProps }
					>
						{ ( { onClose } ) => (
							<>
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
										{ defaultLabel }
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
											onClick={ () => {
												onSelectPreset( preset.slug );
												onClose();
											} }
										>
											{ getSizeLabel( preset ) }
										</MenuItem>
									) ) }
								</MenuGroup>
								<div className="editor-typography-toolbar__custom-size">
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
											}
										} }
									/>
									<RangeControl
										label={ __( 'Custom size' ) }
										hideLabelFromVision
										value={ customPx ?? defaultPx }
										initialPosition={ defaultPx }
										min={ MIN_CUSTOM_FONT_SIZE }
										max={ MAX_CUSTOM_FONT_SIZE }
										withInputField={ false }
										onChange={ ( next ) => {
											const size =
												clampCustomFontSize( next );
											if ( size !== undefined ) {
												onSetCustom( size );
											}
										} }
									/>
								</div>
							</>
						) }
					</DropdownMenu>
				) }
			</ToolbarItem>
		</ToolbarGroup>
	);
}
