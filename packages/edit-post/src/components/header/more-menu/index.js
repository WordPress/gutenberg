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

const getButtonLabel = ( isOpen ) => isOpen ?
	__( 'Hide more tools & options' ) :
	__( 'Show more tools & options' );

const MoreMenu = () => (
	<DropdownMenu
		className="edit-post-more-menu"
		contentClassName="edit-post-more-menu__content"
		position="bottom left"
		icon="ellipsis"
		label={ getButtonLabel }
		labelPosition="bottom"
	>
		{ ( { onClose } ) => (
			<>
				<WritingMenu />
				<ModeSwitcher />
				<PluginMoreMenuGroup.Slot fillProps={ { onClose } } />
				<ToolsMoreMenuGroup.Slot fillProps={ { onClose } } />
				<MenuGroup>
					<OptionsMenuItem onSelect={ onClose } />
				</MenuGroup>
			</>
		) }
	</DropdownMenu>
);

export default MoreMenu;
