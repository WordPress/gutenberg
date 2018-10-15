/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { IconButton, Dropdown } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ModeSwitcher from '../mode-switcher';
import PluginMoreMenuGroup from '../plugins-more-menu-group';
import ToolsMoreMenuGroup from '../tools-more-menu-group';
import WritingMenu from '../writing-menu';

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
				<ToolsMoreMenuGroup.Slot fillProps={ { onClose } } />
			</Fragment>
		) }
	/>
);

export default MoreMenu;
