/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { PreferenceToggleMenuItem } from '@wordpress/preferences';
import { displayShortcut } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import ManagePatternsMenuItem from './manage-patterns-menu-item';
import WelcomeGuideMenuItem from './welcome-guide-menu-item';
import EditPostPreferencesModal from '../preferences-modal';
import { store as editorStore } from '../../store';
import { useDispatch } from '@wordpress/data';

const { ToolsMoreMenuGroup, ViewMoreMenuGroup } = unlock( editorPrivateApis );

const MoreMenu = () => {
	const isLargeViewport = useViewportMatch( 'large' );

	// Action to toggle the FullscreenMode with a Notice for visual feedback.
	const { toggleFullscreenMode } = useDispatch( editorStore );

	return (
		<>
			{ isLargeViewport && (
				<ViewMoreMenuGroup>
					<PreferenceToggleMenuItem
						scope="core/edit-post"
						name="fullscreenMode"
						label={ __( 'Fullscreen mode' ) }
						info={ __( 'Show and hide the admin user interface' ) }
						handleToggling={ false }
						onToggle={ toggleFullscreenMode }
						messageActivated={ __( 'Fullscreen mode activated' ) }
						messageDeactivated={ __(
							'Fullscreen mode deactivated'
						) }
						shortcut={ displayShortcut.secondary( 'f' ) }
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
