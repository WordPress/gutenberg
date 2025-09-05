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
import { store as interfaceStore, ActionItem } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import CopyContentMenuItem from './copy-content-menu-item';
import ModeSwitcher from '../mode-switcher';
import ToolsMoreMenuGroup from './tools-more-menu-group';
import ViewMoreMenuGroup from './view-more-menu-group';
import { store as editorStore } from '../../store';

export default function MoreMenu() {
	const { openModal } = useDispatch( interfaceStore );
	const { set: setPreference } = useDispatch( preferencesStore );
	const { toggleDistractionFree } = useDispatch( editorStore );
	const showIconLabels = useSelect(
		( select ) =>
			select( preferencesStore ).get( 'core', 'showIconLabels' ),
		[]
	);

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
									'Top toolbar activated.'
								) }
								messageDeactivated={ __(
									'Top toolbar deactivated.'
								) }
							/>
							<PreferenceToggleMenuItem
								scope="core"
								name="distractionFree"
								label={ __( 'Distraction free' ) }
								info={ __( 'Write with calmness' ) }
								handleToggling={ false }
								onToggle={ () =>
									toggleDistractionFree( {
										createNotice: false,
									} )
								}
								messageActivated={ __(
									'Distraction free mode activated.'
								) }
								messageDeactivated={ __(
									'Distraction free mode deactivated.'
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
									'Spotlight mode activated.'
								) }
								messageDeactivated={ __(
									'Spotlight mode deactivated.'
								) }
							/>
							<ViewMoreMenuGroup.Slot fillProps={ { onClose } } />
						</MenuGroup>
						<ModeSwitcher />
						<ActionItem.Slot
							name="core/plugin-more-menu"
							label={ __( 'Plugins' ) }
							fillProps={ { onClick: onClose } }
						/>
						<MenuGroup label={ __( 'Tools' ) }>
							<MenuItem
								onClick={ () =>
									openModal( 'editor/keyboard-shortcut-help' )
								}
								shortcut={ displayShortcut.access( 'h' ) }
							>
								{ __( 'Keyboard shortcuts' ) }
							</MenuItem>
							<CopyContentMenuItem />
							<MenuItem
								icon={ external }
								href={ __(
									'https://wordpress.org/documentation/article/wordpress-block-editor/'
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
		</>
	);
}
