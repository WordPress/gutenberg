/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import CopyContentMenuItem from './copy-content-menu-item';
import KeyboardShortcutsHelpMenuItem from './keyboard-shortcuts-help-menu-item';
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
								href={ addQueryArgs( 'edit.php', { post_type: 'wp_block' } ) }
							>
								{ __( 'Manage All Reusable Blocks' ) }
							</MenuItem>
							<KeyboardShortcutsHelpMenuItem onSelect={ onClose } />
							<CopyContentMenuItem />
						</Fragment>
					) }
				</ToolsMoreMenuGroup>
			</Fragment>
		);
	},
} );
