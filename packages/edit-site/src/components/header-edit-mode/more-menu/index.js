/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { displayShortcut } from '@wordpress/keycodes';
import { external, moreVertical } from '@wordpress/icons';
import {
	MenuGroup,
	MenuItem,
	VisuallyHidden,
	DropdownMenu,
} from '@wordpress/components';
import {
	PreferenceToggleMenuItem,
	store as preferencesStore,
} from '@wordpress/preferences';
import { store as coreStore } from '@wordpress/core-data';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import ToolsMoreMenuGroup from '../tools-more-menu-group';
import SiteExport from './site-export';
import WelcomeGuideMenuItem from './welcome-guide-menu-item';
import CopyContentMenuItem from './copy-content-menu-item';
import { unlock } from '../../../lock-unlock';

const { ModeSwitcher, ActionItem, interfaceStore, PreferencesModal } =
	unlock( editorPrivateApis );

export default function MoreMenu( { showIconLabels } ) {
	const { openModal } = useDispatch( interfaceStore );
	const { set: setPreference } = useDispatch( preferencesStore );
	const isBlockBasedTheme = useSelect( ( select ) => {
		return select( coreStore ).getCurrentTheme().is_block_theme;
	}, [] );

	const { toggleDistractionFree } = useDispatch( editorStore );

	const turnOffDistractionFree = () => {
		setPreference( 'core', 'distractionFree', false );
	};

	return (
		<>
			<DropdownMenu
				icon={ moreVertical }
				label={ __( 'Options' ) }
				popoverProps={ {
					placement: 'bottom-end',
					className: 'more-menu-dropdown__content',
				} }
				toggleProps={ {
					showTooltip: ! showIconLabels,
					...( showIconLabels && { variant: 'tertiary' } ),
					tooltipPosition: 'bottom',
					size: 'compact',
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
								label={ __( 'Distraction free' ) }
								info={ __( 'Write with calmness' ) }
								handleToggling={ false }
								onToggle={ toggleDistractionFree }
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
							name="core/plugin-more-menu"
							label={ __( 'Plugins' ) }
							as={ MenuGroup }
							fillProps={ { onClick: onClose } }
						/>
						<MenuGroup label={ __( 'Tools' ) }>
							{ isBlockBasedTheme && <SiteExport /> }
							<MenuItem
								onClick={ () =>
									openModal( 'editor/keyboard-shortcut-help' )
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
									openModal( 'editor/preferences' )
								}
							>
								{ __( 'Preferences' ) }
							</MenuItem>
						</MenuGroup>
					</>
				) }
			</DropdownMenu>
			<PreferencesModal />
		</>
	);
}
