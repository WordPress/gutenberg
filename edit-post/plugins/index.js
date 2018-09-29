/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import CopyContentMenuItem from './copy-content-menu-item';
import KeyboardShortcutsHelpMenuItem from './keyboard-shortcuts-help-menu-item';
import PublishSidebarToggleMenuItem from './publish-sidebar-toggle-menu-item';
import TipsToggleMenuItem from './tips-toggle-menu-item';
import ToolsMoreMenuGroup from '../components/header/tools-more-menu-group';

registerPlugin( 'edit-post', {
	render() {
		return (
			<Fragment>
				<ToolsMoreMenuGroup>
					{ ( { onClose } ) => (
						<Fragment>
							<MenuItem
								role="menuitem"
								href="edit.php?post_type=wp_block"
							>
								{ __( 'Manage All Reusable Blocks' ) }
							</MenuItem>
							<TipsToggleMenuItem onToggle={ onClose } />
							<PublishSidebarToggleMenuItem onToggle={ onClose } />
							<KeyboardShortcutsHelpMenuItem onSelect={ onClose } />
							<CopyContentMenuItem />
						</Fragment>
					) }
				</ToolsMoreMenuGroup>
			</Fragment>
		);
	},
} );
