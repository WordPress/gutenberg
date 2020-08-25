/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { ActionItem } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import ModeSwitcher from '../mode-switcher';
import ToolsMoreMenuGroup from '../tools-more-menu-group';
import OptionsMenuItem from '../options-menu-item';
import WritingMenu from '../writing-menu';

const POPOVER_PROPS = {
	className: 'edit-post-more-menu__content',
	position: 'bottom left',
};
const TOGGLE_PROPS = {
	tooltipPosition: 'bottom',
};

const MoreMenu = ( { showTooltip } ) => (
	<DropdownMenu
		className="edit-post-more-menu"
		icon={ moreVertical }
		/* translators: button label text should, if possible, be under 16 characters. */
		label={ __( 'More options' ) }
		popoverProps={ POPOVER_PROPS }
		toggleProps={ {
			showTooltip,
			isTertiary: ! showTooltip,
			...TOGGLE_PROPS,
		} }
	>
		{ ( { onClose } ) => (
			<>
				<WritingMenu />
				<ModeSwitcher />
				<ActionItem.Slot
					name="core/edit-post/plugin-more-menu"
					label={ __( 'Plugins' ) }
					as={ [ MenuGroup, MenuItem ] }
					fillProps={ { onClick: onClose } }
				/>
				<ToolsMoreMenuGroup.Slot fillProps={ { onClose } } />
				<MenuGroup>
					<OptionsMenuItem />
				</MenuGroup>
			</>
		) }
	</DropdownMenu>
);

export default MoreMenu;
