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
		<>
			<ComplementaryArea.Slot
				scope="core/edit-site"
				className="edit-site-complementary-area"
			/>
			<ComplementaryArea
				scope="core/edit-site"
				complementaryAreaIdentifier="edit-site/global-styles"
				title={ __( 'Global Styles' ) }
				icon={ typography }
				className="edit-site-complementary-area"
			>
				<GlobalStylesControls bubblesVirtually />
			</ComplementaryArea>
			<ComplementaryArea
				scope="core/edit-site"
				complementaryAreaIdentifier="edit-site/block-inspector"
				title={ __( 'Block Inspector' ) }
				icon={ cog }
				className="edit-site-complementary-area"
			>
				<InspectorSlot bubblesVirtually />
			</ComplementaryArea>
		</>
	);
}

Sidebar.InspectorFill = InspectorFill;

export default Sidebar;
