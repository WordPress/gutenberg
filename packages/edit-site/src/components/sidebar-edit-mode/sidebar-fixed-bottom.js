/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { createPrivateSlotFill } = unlock( componentsPrivateApis );
const SIDEBAR_FIXED_BOTTOM_SLOT_FILL_NAME = 'SidebarFixedBottom';
const { Slot: SidebarFixedBottomSlot, Fill: SidebarFixedBottomFill } =
	createPrivateSlotFill( SIDEBAR_FIXED_BOTTOM_SLOT_FILL_NAME );

export default function SidebarFixedBottom( { children } ) {
	return (
		<SidebarFixedBottomFill>
			<div className="edit-site-sidebar-fixed-bottom-slot">
				{ children }
			</div>
		</SidebarFixedBottomFill>
	);
}

export { SidebarFixedBottomSlot };
