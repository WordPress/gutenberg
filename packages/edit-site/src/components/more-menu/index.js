import { privateApis as editorPrivateApis } from '@wordpress/editor';
import SiteExport from './site-export';
import WelcomeGuideMenuItem from './welcome-guide-menu-item';
import { unlock } from '../../lock-unlock';

const { ToolsMoreMenuGroup, PreferencesModal } = unlock( editorPrivateApis );

export default function MoreMenu() {
	return (
		<>
			<ToolsMoreMenuGroup>
				<SiteExport />
				<WelcomeGuideMenuItem />
			</ToolsMoreMenuGroup>
			<PreferencesModal />
		</>
	);
}
