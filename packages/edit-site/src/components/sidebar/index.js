/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { ComplementaryArea } from '@wordpress/interface';
import { __ } from '@wordpress/i18n';
import { cog, typography } from '@wordpress/icons';
import { GlobalStylesControls } from '@wordpress/global-styles';

const { Slot: InspectorSlot, Fill: InspectorFill } = createSlotFill(
	'EditSiteSidebarInspector'
);
function Sidebar() {
	return (
		<div className="edit-site-sidebar">
			<ComplementaryArea.Slot scope="core/edit-site" />
			<ComplementaryArea
				scope="core/edit-site"
				complementaryAreaIdentifier="edit-site/global-styles"
				title={ __( 'Global Styles' ) }
				icon={ typography }
			>
				<GlobalStylesControls bubblesVirtually />
			</ComplementaryArea>
			<ComplementaryArea
				scope="core/edit-site"
				complementaryAreaIdentifier="edit-site/block-inspector"
				title={ __( 'Block Inspector' ) }
				icon={ cog }
			>
				<InspectorSlot bubblesVirtually />
			</ComplementaryArea>
		</div>
	);
}

Sidebar.InspectorFill = InspectorFill;

export default Sidebar;
