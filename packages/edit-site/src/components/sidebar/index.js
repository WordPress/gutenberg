/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { PluginSidebar } from '@wordpress/plugins';
import { __ } from '@wordpress/i18n';
import { cog, pencil } from '@wordpress/icons';

const { Slot: InspectorSlot, Fill: InspectorFill } = createSlotFill(
	'EditSiteSidebarInspector'
);
function Sidebar() {
	return (
		<>
			<PluginSidebar.Slot scope="edit-site/sidebar">
				{ ( fills ) => {
					return (
						fills.length > 0 && (
							<div
								className="edit-site-sidebar"
								role="region"
								aria-label={ __(
									'Site editor advanced settings.'
								) }
								tabIndex="-1"
							>
								{ fills }
							</div>
						)
					);
				} }
			</PluginSidebar.Slot>
			<PluginSidebar
				scope="edit-site/sidebar"
				sidebarName="block-inspector"
				title={ __( 'Block Inspector' ) }
				icon={ cog }
			>
				<InspectorSlot bubblesVirtually />
			</PluginSidebar>
			<PluginSidebar
				scope="edit-site/sidebar"
				sidebarName="global-styles"
				title={ __( 'Global Styles' ) }
				icon={ pencil }
			>
				<p>Global Styles area</p>
			</PluginSidebar>
		</>
	);
}

Sidebar.InspectorFill = InspectorFill;

export default Sidebar;
