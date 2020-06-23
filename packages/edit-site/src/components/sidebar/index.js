/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { cog, pencil } from '@wordpress/icons';

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
			>
				<InspectorSlot bubblesVirtually />
			</DefaultSidebar>
			<GlobalStylesSidebar
				identifier="edit-site/global-styles"
				title={ __( 'Global Styles' ) }
				icon={ pencil }
			/>
		</>
	);
}
