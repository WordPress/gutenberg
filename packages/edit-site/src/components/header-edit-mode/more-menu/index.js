/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { displayShortcut } from '@wordpress/keycodes';
import { external } from '@wordpress/icons';
import { MenuGroup, MenuItem, VisuallyHidden } from '@wordpress/components';
import {
	ActionItem,
	MoreMenuDropdown,
	store as interfaceStore,
} from '@wordpress/interface';
import {
	PreferenceToggleMenuItem,
	store as preferencesStore,
} from '@wordpress/preferences';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import {
	KEYBOARD_SHORTCUT_HELP_MODAL_NAME,
	default as KeyboardShortcutHelpModal,
} from '../../keyboard-shortcut-help-modal';
import {
	PREFERENCES_MODAL_NAME,
	default as EditSitePreferencesModal,
} from '../../preferences-modal';
import ToolsMoreMenuGroup from '../tools-more-menu-group';
import SiteExport from './site-export';
import WelcomeGuideMenuItem from './welcome-guide-menu-item';
import CopyContentMenuItem from './copy-content-menu-item';
import ModeSwitcher from '../mode-switcher';
import { store as siteEditorStore } from '../../../store';

export default function MoreMenu( { showIconLabels } ) {
	const registry = useRegistry();

	const { closeGeneralSidebar } = useDispatch( siteEditorStore );
	const { setIsInserterOpened, setIsListViewOpened } =
		useDispatch( editorStore );
	const { openModal } = useDispatch( interfaceStore );
	const { set: setPreference } = useDispatch( preferencesStore );
	const isBlockBasedTheme = useSelect( ( select ) => {
		return select( coreStore ).getCurrentTheme().is_block_theme;
	}, [] );

	const toggleDistractionFree = () => {
		registry.batch( () => {
			setPreference( 'core', 'fixedToolbar', true );
			setIsInserterOpened( false );
			setIsListViewOpened( false );
			closeGeneralSidebar();
		} );
	};

	const turnOffDistractionFree = () => {
		setPreference( 'core', 'distractionFree', false );
	};

	return (
		<>
			<MoreMenuDropdown
				toggleProps={ {
					showTooltip: ! showIconLabels,
					...( showIconLabels && { variant: 'tertiary' } ),
				} }
			>
				{ ( { onClose } ) => (
					<>
						<MenuGroup label={ _x( 'View', 'noun' ) }>
							<PreferenceToggleMenuItem
								scope="core"
								name="fixedToolbar"
								onToggle={ turnOffDistractionFree }
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
							<PreferenceToggleMenuItem
								scope="core"
								name="distractionFree"
								onToggle={ toggleDistractionFree }
								label={ __( 'Distraction free' ) }
								info={ __( 'Write with calmness' ) }
								messageActivated={ __(
									'Distraction free mode activated'
								) }
								messageDeactivated={ __(
									'Distraction free mode deactivated'
								) }
								shortcut={ displayShortcut.primaryShift(
									'\\'
								) }
							/>
							<PreferenceToggleMenuItem
								scope="core"
								name="focusMode"
								label={ __( 'Spotlight mode' ) }
								info={ __( 'Focus on one block at a time' ) }
								messageActivated={ __(
									'Spotlight mode activated'
								) }
								messageDeactivated={ __(
									'Spotlight mode deactivated'
								) }
							/>
						</MenuGroup>
						<ModeSwitcher />
						<ActionItem.Slot
							name="core/edit-site/plugin-more-menu"
							label={ __( 'Plugins' ) }
							as={ MenuGroup }
							fillProps={ { onClick: onClose } }
						/>
						<MenuGroup label={ __( 'Tools' ) }>
							{ isBlockBasedTheme && <SiteExport /> }
							<MenuItem
								onClick={ () =>
									openModal(
										KEYBOARD_SHORTCUT_HELP_MODAL_NAME
									)
								}
								shortcut={ displayShortcut.access( 'h' ) }
							>
								{ __( 'Keyboard shortcuts' ) }
							</MenuItem>
							<WelcomeGuideMenuItem />
							<CopyContentMenuItem />
							<MenuItem
								icon={ external }
								role="menuitem"
								href={ __(
									'https://wordpress.org/documentation/article/site-editor/'
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
						<MenuGroup>
							<MenuItem
								onClick={ () =>
									openModal( PREFERENCES_MODAL_NAME )
								}
							>
								{ __( 'Preferences' ) }
							</MenuItem>
						</MenuGroup>
					</>
				) }
			</MoreMenuDropdown>
			<KeyboardShortcutHelpModal />
			<EditSitePreferencesModal />
		</>
	);
}
