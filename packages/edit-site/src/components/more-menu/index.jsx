import { privateApis as editorPrivateApis } from '@wordpress/editor';
import WelcomeGuideMenuItem from './welcome-guide-menu-item';
import { unlock } from '../../lock-unlock';

const { ToolsMoreMenuGroup, PreferencesModal, SiteExport } =
	unlock( editorPrivateApis );

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
