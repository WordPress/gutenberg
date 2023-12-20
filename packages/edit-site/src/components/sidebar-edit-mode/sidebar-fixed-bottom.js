/**
 * External dependencies
 */
import classnames from 'classnames';

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

export default function SidebarFixedBottom( { className, children } ) {
	return (
		<SidebarFixedBottomFill>
			<div
				className={ classnames(
					'edit-site-sidebar-fixed-bottom-slot',
					className
				) }
			>
				{ children }
			</div>
		</SidebarFixedBottomFill>
	);
}

export { SidebarFixedBottomSlot };
