/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, Dropdown, MenuGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import ModeSwitcher from '../mode-switcher';
import FixedToolbarToggle from '../fixed-toolbar-toggle';
import { MoreMenuContextProvider } from '../more-menu-context';
import PluginMoreMenuGroup from '../plugins-more-menu-group';

const MoreMenu = () => (
	<Dropdown
		className="edit-post-more-menu"
		position="bottom left"
		renderToggle={ ( { isOpen, onToggle } ) => (
			<IconButton
				icon="ellipsis"
				label={ __( 'More' ) }
				onClick={ onToggle }
				aria-expanded={ isOpen }
			/>
		) }
		renderContent={ ( args ) => (
			<MoreMenuContextProvider value={ args }>
				<div className="edit-post-more-menu__content">
					<ModeSwitcher onSelect={ args.onClose } />
					<FixedToolbarToggle onToggle={ args.onClose } />
					<PluginMoreMenuGroup.Slot />
					<MenuGroup
						label={ __( 'Tools' ) }
						filterName="editPost.MoreMenu.tools"
					/>
				</div>
			</MoreMenuContextProvider>
		) }
	/>
);

export default MoreMenu;
