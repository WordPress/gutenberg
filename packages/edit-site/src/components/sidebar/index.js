/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { ComplementaryArea } from '@wordpress/interface';
import { __ } from '@wordpress/i18n';
import { cog, pencil } from '@wordpress/icons';

const { Slot: InspectorSlot, Fill: InspectorFill } = createSlotFill(
	'EditSiteSidebarInspector'
);
function Sidebar() {
	return (
		<>
			<ComplementaryArea.Slot scope="edit-site" />
			<ComplementaryArea
				scope="edit-site"
				complementaryAreaIdentifier="edit-site/block-inspector"
				title={ __( 'Block Inspector' ) }
				icon={ cog }
			>
				<InspectorSlot bubblesVirtually />
			</ComplementaryArea>
			<ComplementaryArea
				scope="edit-site"
				complementaryAreaIdentifier="edit-site/global-styles"
				title={ __( 'Global Styles' ) }
				icon={ pencil }
			>
				<p>Global Styles area</p>
			</ComplementaryArea>
		</>
	);
}

Sidebar.InspectorFill = InspectorFill;

export default Sidebar;
