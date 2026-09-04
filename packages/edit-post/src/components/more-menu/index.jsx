import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import {
	ariaKeyShortcut,
	displayShortcut,
	shortcutAriaLabel,
} from '@wordpress/keycodes';
import { unlock } from '../../lock-unlock';
import ManagePatternsMenuItem from './manage-patterns-menu-item';
import WelcomeGuideMenuItem from './welcome-guide-menu-item';
import EditPostPreferencesModal from '../preferences-modal';

const { MoreMenuPreferenceItem, ToolsMoreMenuGroup, ViewMoreMenuGroup } =
	unlock( editorPrivateApis );

const FULLSCREEN_SHORTCUT = {
	ariaKeyShortcut: ariaKeyShortcut.secondary( 'f' ),
	displayShortcut: displayShortcut.secondary( 'f' ),
	label: shortcutAriaLabel.secondary( 'f' ),
};

const MoreMenu = () => {
	const isLargeViewport = useViewportMatch( 'large' );

	return (
		<>
			{ isLargeViewport && (
				<ViewMoreMenuGroup>
					<MoreMenuPreferenceItem
						scope="core/edit-post"
						name="fullscreenMode"
						label={ __( 'Fullscreen mode' ) }
						info={ __( 'Show and hide the admin user interface' ) }
						messageActivated={ __( 'Fullscreen mode activated.' ) }
						messageDeactivated={ __(
							'Fullscreen mode deactivated.'
						) }
						shortcut={ FULLSCREEN_SHORTCUT }
					/>
				</ViewMoreMenuGroup>
			) }
			<ToolsMoreMenuGroup>
				<ManagePatternsMenuItem />
				<WelcomeGuideMenuItem />
			</ToolsMoreMenuGroup>
			<EditPostPreferencesModal />
		</>
	);
};

export default MoreMenu;
