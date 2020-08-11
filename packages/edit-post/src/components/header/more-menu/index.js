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

const MoreMenu = () => (
	<DropdownMenu
		className="edit-post-more-menu"
		icon={ moreVertical }
		label={ __( 'More tools & options' ) }
		popoverProps={ POPOVER_PROPS }
		toggleProps={ TOGGLE_PROPS }
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
