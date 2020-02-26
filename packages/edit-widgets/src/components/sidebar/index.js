/**
 * WordPress dependencies
 */
import { createSlotFill, Panel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';

export const {
	Fill: BlockSidebarFill,
	Slot: BlockSidebarSlot,
} = createSlotFill( 'EditWidgetsBlockSidebar' );

function Sidebar() {
	const isMobile = useViewportMatch( 'medium', '<' );

	// Disable on mobile temporarily
	if ( isMobile ) {
		return null;
	}

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
