/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import CopyContentMenuItem from './copy-content-menu-item';
import ManageBlocksMenuItem from './manage-blocks-menu-item';
import KeyboardShortcutsHelpMenuItem from './keyboard-shortcuts-help-menu-item';
import ToolsMoreMenuGroup from '../components/header/tools-more-menu-group';

registerPlugin( 'edit-post', {
	render() {
		return (
			<>
				<ToolsMoreMenuGroup>
					{ ( { onClose } ) => (
						<>
							<ManageBlocksMenuItem onSelect={ onClose } />
							<MenuItem
								role="menuitem"
								href={ addQueryArgs( 'edit.php', { post_type: 'wp_block' } ) }
							>
								{ __( 'Manage All Reusable Blocks' ) }
							</MenuItem>
							<KeyboardShortcutsHelpMenuItem onSelect={ onClose } />
							<CopyContentMenuItem />
						</>
					) }
				</ToolsMoreMenuGroup>
			</>
		);
	},
} );
