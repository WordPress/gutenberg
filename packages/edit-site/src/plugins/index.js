/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import ToolsMoreMenuGroup from '../components/header/tools-more-menu-group';
import SiteExport from './site-export';
import WelcomeGuideMenuItem from './welcome-guide-menu-item';

registerPlugin( 'edit-site', {
	render() {
		return (
			<>
				<ToolsMoreMenuGroup>
					<SiteExport />
					<WelcomeGuideMenuItem />
					<MenuItem
						href={ __(
							'https://wordpress.org/support/article/site-editor/'
						) }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'Help' ) }
					</MenuItem>
				</ToolsMoreMenuGroup>
			</>
		);
	},
} );
