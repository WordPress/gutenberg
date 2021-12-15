/**
 * WordPress dependencies
 */
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
				</ToolsMoreMenuGroup>
			</>
		);
	},
} );
