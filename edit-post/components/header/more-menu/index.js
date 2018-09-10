/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { IconButton, Dropdown, MenuGroup, MenuItem } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import ModeSwitcher from '../mode-switcher';
import PluginMoreMenuGroup from '../plugins-more-menu-group';
import TipsToggle from '../tips-toggle';
import KeyboardShortcutsHelpMenuItem from '../keyboard-shortcuts-help-menu-item';
import WritingMenu from '../writing-menu';
import PublishSidebarToggle from '../publish-sidebar-toggle';

const MoreMenu = () => (
	<Dropdown
		className="edit-post-more-menu"
		contentClassName="edit-post-more-menu__content"
		position="bottom left"
		renderToggle={ ( { isOpen, onToggle } ) => (
			<IconButton
				icon="ellipsis"
				label={ _x( 'More', 'button to expand options' ) }
				onClick={ onToggle }
				aria-expanded={ isOpen }
			/>
		) }
		renderContent={ ( { onClose } ) => (
			<Fragment>
				<WritingMenu onClose={ onClose } />
				<ModeSwitcher onSelect={ onClose } />
				<PluginMoreMenuGroup.Slot fillProps={ { onClose } } />
				<MenuGroup
					label={ __( 'Tools' ) }
					filterName="editPost.MoreMenu.tools"
				>
					<MenuItem
						role="menuitem"
						href="edit.php?post_type=wp_block"
					>
						{ __( 'Manage All Reusable Blocks' ) }
					</MenuItem>
					<TipsToggle onToggle={ onClose } />
					<PublishSidebarToggle onToggle={ onClose } />
					<KeyboardShortcutsHelpMenuItem onSelect={ onClose } />
				</MenuGroup>
			</Fragment>
		) }
	/>
);

export default MoreMenu;
