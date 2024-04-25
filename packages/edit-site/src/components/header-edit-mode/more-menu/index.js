/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import SiteExport from './site-export';
import WelcomeGuideMenuItem from './welcome-guide-menu-item';
import { unlock } from '../../../lock-unlock';

const { ToolsMoreMenuGroup, PreferencesModal } = unlock( editorPrivateApis );

export default function MoreMenu() {
	const isBlockBasedTheme = useSelect( ( select ) => {
		return select( coreStore ).getCurrentTheme().is_block_theme;
	}, [] );

	return (
		<>
			<ToolsMoreMenuGroup>
				{ isBlockBasedTheme && <SiteExport /> }
				<WelcomeGuideMenuItem />
			</ToolsMoreMenuGroup>
			<PreferencesModal />
		</>
	);
}
