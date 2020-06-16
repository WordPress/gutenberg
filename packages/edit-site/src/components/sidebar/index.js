/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import {
	ComplementaryArea,
	ComplementaryAreaMoreMenuItem,
} from '@wordpress/interface';
import { __ } from '@wordpress/i18n';
import { cog, pencil } from '@wordpress/icons';
import { Platform } from '@wordpress/element';

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
				<p>Global Styles area</p>
			</DefaultSidebar>
		</>
	);
}
