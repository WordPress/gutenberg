/**
 * WordPress dependencies
 */
import { MenuGroup, MenuItem, VisuallyHidden } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import { MoreMenuDropdown } from '@wordpress/interface';
import { PreferenceToggleMenuItem } from '@wordpress/preferences';
import { displayShortcut } from '@wordpress/keycodes';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import KeyboardShortcutHelpModal from '../keyboard-shortcut-help-modal';
import ToolsMoreMenuGroup from './tools-more-menu-group';

export default function MoreMenu() {
	const [
		isKeyboardShortcutsModalActive,
		setIsKeyboardShortcutsModalVisible,
	] = useState( false );
	const toggleKeyboardShortcutsModal = () =>
		setIsKeyboardShortcutsModalVisible( ! isKeyboardShortcutsModalActive );

	useShortcut(
		'core/edit-widgets/keyboard-shortcuts',
		toggleKeyboardShortcutsModal
	);

	const isLargeViewport = useViewportMatch( 'medium' );

	return (
		<>
			<MoreMenuDropdown>
				{ ( onClose ) => (
					<>
						{ isLargeViewport && (
							<MenuGroup label={ _x( 'View', 'noun' ) }>
								<PreferenceToggleMenuItem
									scope="core/edit-widgets"
									name="fixedToolbar"
									label={ __( 'Top toolbar' ) }
									info={ __(
										'Access all block and document tools in a single place'
									) }
									messageActivated={ __(
										'Top toolbar activated'
									) }
									messageDeactivated={ __(
										'Top toolbar deactivated'
									) }
								/>
							</MenuGroup>
						) }
						<MenuGroup label={ __( 'Tools' ) }>
							<MenuItem
								onClick={ () => {
									setIsKeyboardShortcutsModalVisible( true );
								} }
								shortcut={ displayShortcut.access( 'h' ) }
							>
								{ __( 'Keyboard shortcuts' ) }
							</MenuItem>
							<PreferenceToggleMenuItem
								scope="core/edit-widgets"
								name="welcomeGuide"
								label={ __( 'Welcome Guide' ) }
							/>
							<MenuItem
								role="menuitem"
								icon={ external }
								href={ __(
									'https://wordpress.org/support/article/block-based-widgets-editor/'
								) }
								target="_blank"
								rel="noopener noreferrer"
							>
								{ __( 'Help' ) }
								<VisuallyHidden as="span">
									{
										/* translators: accessibility text */
										__( '(opens in a new tab)' )
									}
								</VisuallyHidden>
							</MenuItem>
							<ToolsMoreMenuGroup.Slot
								fillProps={ { onClose } }
							/>
						</MenuGroup>
						<MenuGroup label={ __( 'Preferences' ) }>
							<PreferenceToggleMenuItem
								scope="core/edit-widgets"
								name="keepCaretInsideBlock"
								label={ __(
									'Contain text cursor inside block'
								) }
								info={ __(
									'Aids screen readers by stopping text caret from leaving blocks.'
								) }
								messageActivated={ __(
									'Contain text cursor inside block activated'
								) }
								messageDeactivated={ __(
									'Contain text cursor inside block deactivated'
								) }
							/>
							<PreferenceToggleMenuItem
								scope="core/edit-widgets"
								name="themeStyles"
								info={ __(
									'Make the editor look like your theme.'
								) }
								label={ __( 'Use theme styles' ) }
							/>
							{ isLargeViewport && (
								<PreferenceToggleMenuItem
									scope="core/edit-widgets"
									name="showBlockBreadcrumbs"
									label={ __( 'Display block breadcrumbs' ) }
									info={ __(
										'Shows block breadcrumbs at the bottom of the editor.'
									) }
									messageActivated={ __(
										'Display block breadcrumbs activated'
									) }
									messageDeactivated={ __(
										'Display block breadcrumbs deactivated'
									) }
								/>
							) }
						</MenuGroup>
					</>
				) }
			</MoreMenuDropdown>
			<KeyboardShortcutHelpModal
				isModalActive={ isKeyboardShortcutsModalActive }
				toggleModal={ toggleKeyboardShortcutsModal }
			/>
		</>
	);
}
