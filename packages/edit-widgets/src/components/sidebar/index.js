/**
 * WordPress dependencies
 */
import { createSlotFill, Panel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const { Fill: BlockSidebarFill, Slot: BlockSidebarSlot } = createSlotFill( 'EditWidgetsBlockSidebar' );

function Sidebar() {
	return (
		<div
			className="edit-widgets-sidebar"
			role="region"
			aria-label={ __( 'Widgets advanced settings' ) }
			tabIndex="-1"
		>
			<Panel header={ __( 'Block Areas' ) }>
				<BlockSidebarSlot bubblesVirtually />
			</Panel>
		</div>
	);
}

Sidebar.Inspector = BlockSidebarFill;

export default Sidebar;
