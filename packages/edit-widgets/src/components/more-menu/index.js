/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	VisuallyHidden,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { external, moreVertical } from '@wordpress/icons';
import { displayShortcut } from '@wordpress/keycodes';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import FeatureToggle from './feature-toggle';
import KeyboardShortcutHelpModal from '../keyboard-shortcut-help-modal';

const POPOVER_PROPS = {
	className: 'edit-widgets-more-menu__content',
	position: 'bottom left',
};
const TOGGLE_PROPS = {
	tooltipPosition: 'bottom',
};

export default function MoreMenu() {
	const [
		isKeyboardShortcutsModalActive,
		setIsKeyboardShortcutsModalVisible,
	] = useState( false );
	const toggleKeyboardShortcutsModal = () =>
		setIsKeyboardShortcutsModalVisible( ! isKeyboardShortcutsModalActive );

	useShortcut(
		'core/edit-widgets/keyboard-shortcuts',
		toggleKeyboardShortcutsModal,
		{
			bindGlobal: true,
		}
	);

	const isLargeViewport = useViewportMatch( 'medium' );

	return (
		<>
			<DropdownMenu
				className="edit-widgets-more-menu"
				icon={ moreVertical }
				/* translators: button label text should, if possible, be under 16 characters. */
				label={ __( 'Options' ) }
				popoverProps={ POPOVER_PROPS }
				toggleProps={ TOGGLE_PROPS }
			>
				{ () => (
					<>
						{ isLargeViewport && (
							<MenuGroup label={ _x( 'View', 'noun' ) }>
								<FeatureToggle
									feature="fixedToolbar"
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
							<FeatureToggle
								feature="welcomeGuide"
								label={ __( 'Welcome Guide' ) }
							/>
							<MenuItem
								role="menuitem"
								icon={ external }
								href={ __(
									'https://wordpress.org/support/article/wordpress-editor/'
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
						</MenuGroup>
						<MenuGroup label={ __( 'Preferences' ) }>
							<FeatureToggle
								feature="keepCaretInsideBlock"
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
							<FeatureToggle
								feature="themeStyles"
								info={ __(
									'Make the editor look like your theme.'
								) }
								label={ __( 'Use theme styles' ) }
							/>
							{ isLargeViewport && (
								<FeatureToggle
									feature="showBlockBreadcrumbs"
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
			</DropdownMenu>
			<KeyboardShortcutHelpModal
				isModalActive={ isKeyboardShortcutsModalActive }
				toggleModal={ toggleKeyboardShortcutsModal }
			/>
		</>
	);
}
