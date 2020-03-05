/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { PluginComplementaryArea } from '@wordpress/interface';
import { __ } from '@wordpress/i18n';
import { cog, pencil } from '@wordpress/icons';

const { Slot: InspectorSlot, Fill: InspectorFill } = createSlotFill(
	'EditSiteSidebarInspector'
);
function Sidebar() {
	return (
		<>
			<PluginComplementaryArea.Slot scope="edit-site" />
			<PluginComplementaryArea
				scope="edit-site"
				complementaryAreaName="edit-site/block-inspector"
				title={ __( 'Block Inspector' ) }
				icon={ cog }
			>
				<InspectorSlot bubblesVirtually />
			</PluginComplementaryArea>
			<PluginComplementaryArea
				scope="edit-site"
				complementaryAreaName="edit-site/global-styles"
				title={ __( 'Global Styles' ) }
				icon={ pencil }
			>
				<p>Global Styles area</p>
			</PluginComplementaryArea>
		</>
	);
}

Sidebar.InspectorFill = InspectorFill;

export default Sidebar;
