/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { cog, typography } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import DefaultSidebar from './default-sidebar';
import GlobalStylesSidebar from './global-styles-sidebar';

const { Slot: InspectorSlot, Fill: InspectorFill } = createSlotFill(
	'EditSiteSidebarInspector'
);
export const SidebarInspectorFill = InspectorFill;

export function SidebarComplementaryAreaFills() {
	return (
		<>
			<DefaultSidebar
				identifier="edit-site/block-inspector"
				title={ __( 'Block Inspector' ) }
				icon={ cog }
				closeLabel={ __( 'Close block inspector sidebar' ) }
			>
				<InspectorSlot bubblesVirtually />
			</DefaultSidebar>
			<GlobalStylesSidebar
				identifier="edit-site/global-styles"
				title={ __( 'Global Styles' ) }
				closeLabel={ __( 'Close global styles sidebar' ) }
				icon={ typography }
			/>
		</>
	);
}
