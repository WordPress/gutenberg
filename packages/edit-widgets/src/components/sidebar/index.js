/**
 * WordPress dependencies
 */
import { createSlotFill, Panel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const {
	Fill: BlockSidebarFill,
	Slot: BlockSidebarSlot,
} = createSlotFill( 'EditWidgetsBlockSidebar' );

function Sidebar() {
	return (
		<div className="edit-widgets-sidebar">
			<Panel header={ __( 'Block Areas' ) }>
				<BlockSidebarSlot bubblesVirtually />
			</Panel>
		</div>
	);
}

Sidebar.Inspector = BlockSidebarFill;

export default Sidebar;
