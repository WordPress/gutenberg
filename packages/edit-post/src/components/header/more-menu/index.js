/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DropdownMenu, MenuGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ModeSwitcher from '../mode-switcher';
import PluginMoreMenuGroup from '../plugins-more-menu-group';
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
		icon="ellipsis"
		label={ __( 'More tools & options' ) }
		popoverProps={ POPOVER_PROPS }
		toggleProps={ TOGGLE_PROPS }
	>
		{ ( { onClose } ) => (
			<>
				<WritingMenu />
				<ModeSwitcher />
				<PluginMoreMenuGroup.Slot fillProps={ { onClose } } />
				<ToolsMoreMenuGroup.Slot fillProps={ { onClose } } />
				<MenuGroup>
					<OptionsMenuItem />
				</MenuGroup>
			</>
		) }
	</DropdownMenu>
);

export default MoreMenu;
