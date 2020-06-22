/**
 * WordPress dependencies
 */
import { createSlotFill, PanelBody } from '@wordpress/components';
import {
	ComplementaryArea,
	ComplementaryAreaMoreMenuItem,
} from '@wordpress/interface';
import { __ } from '@wordpress/i18n';
import { cog, pencil } from '@wordpress/icons';
import { Platform } from '@wordpress/element';
import {
	FontSizePicker,
	__experimentalLineHeightControl as LineHeightControl,
} from '@wordpress/block-editor';
import { getBlockTypes } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

const { Slot: InspectorSlot, Fill: InspectorFill } = createSlotFill(
	'EditSiteSidebarInspector'
);
export const SidebarInspectorFill = InspectorFill;
const BLOCK_INSPECTOR_ACTIVE_BY_DEFAULT = Platform.select( {
	web: true,
	native: false,
} );

const DefaultSidebar = ( { identifier, title, icon, children } ) => {
	return (
		<>
			<ComplementaryArea
				scope="core/edit-site"
				identifier={ identifier }
				title={ title }
				icon={ icon }
			>
				{ children }
			</ComplementaryArea>
			<ComplementaryAreaMoreMenuItem
				scope="core/edit-site"
				identifier={ identifier }
				icon={ icon }
			>
				{ title }
			</ComplementaryAreaMoreMenuItem>
		</>
	);
};

export function SidebarComplementaryAreaFills() {
	const {
		__experimentalGlobalStylesUser: userStyles,
	} = useSelect( ( select ) => select( 'core/block-editor' ).getSettings() );

	const fromPx = ( value ) => +value?.replace( 'px', '' ) ?? null;
	const getFontSizeValue = ( blockName ) =>
		fromPx( userStyles?.[ blockName ]?.styles?.typography?.fontSize ) ??
		null;

	const getLineHeightValue = ( blockName ) =>
		userStyles?.[ blockName ]?.styles?.typography?.lineHeight ?? null;

	return (
		<>
			<DefaultSidebar
				identifier="edit-site/block-inspector"
				title={ __( 'Block Inspector' ) }
				icon={ cog }
				isActiveByDefault={ BLOCK_INSPECTOR_ACTIVE_BY_DEFAULT }
			>
				<InspectorSlot bubblesVirtually />
			</DefaultSidebar>
			<DefaultSidebar
				identifier="edit-site/global-styles"
				title={ __( 'Global Styles' ) }
				icon={ pencil }
			>
				<PanelBody title={ __( 'Typography' ) } initialOpen={ true }>
					{ getBlockTypes()
						.map(
							( {
								name,
								title,
								supports: {
									__experimentalFontSize,
									__experimentalLineHeight,
								},
							} ) => {
								const panels = [];
								panels.push( <h3>{ title }</h3> );

								if ( __experimentalFontSize ) {
									panels.push(
										<FontSizePicker
											value={ getFontSizeValue( name ) }
											onChange={ () =>
												console.log(
													'change font size'
												)
											}
										/>
									);
								}

								if ( __experimentalLineHeight ) {
									panels.push(
										<LineHeightControl
											value={ getLineHeightValue( name ) }
											onChange={ () =>
												console.log(
													'change line height'
												)
											}
										/>
									);
								}

								return panels.length > 1 ? panels : null;
							}
						)
						.filter( Boolean ) }
				</PanelBody>
			</DefaultSidebar>
		</>
	);
}
