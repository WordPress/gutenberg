/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, Dropdown, MenuGroup } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ModeSwitcher from '../mode-switcher';
import PluginMoreMenuGroup from '../plugins-more-menu-group';
import ToolsMoreMenuGroup from '../tools-more-menu-group';
import OptionsMenuItem from '../options-menu-item';
import WritingMenu from '../writing-menu';

const ariaClosed = __( 'Show more tools & options' );
const ariaOpen = __( 'Hide more tools & options' );

const MoreMenu = () => (
	<Dropdown
		className="edit-post-more-menu"
		contentClassName="edit-post-more-menu__content"
		position="bottom left"
		renderToggle={ ( { isOpen, onToggle } ) => (
			<IconButton
				icon="ellipsis"
				label={ isOpen ? ariaOpen : ariaClosed }
				labelPosition="bottom"
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
				<MenuGroup>
					<OptionsMenuItem onSelect={ onClose } />
				</MenuGroup>
			</Fragment>
		) }
	/>
);

export default MoreMenu;
