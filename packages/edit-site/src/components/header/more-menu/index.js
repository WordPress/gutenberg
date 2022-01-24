/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { useReducer } from '@wordpress/element';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { displayShortcut } from '@wordpress/keycodes';
import { external, moreVertical } from '@wordpress/icons';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	VisuallyHidden,
} from '@wordpress/components';
import { ActionItem } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import KeyboardShortcutHelpModal from '../../keyboard-shortcut-help-modal';
import FeatureToggle from '../feature-toggle';
import ToolsMoreMenuGroup from '../tools-more-menu-group';
import SiteExport from './site-export';
import WelcomeGuideMenuItem from './welcome-guide-menu-item';
import CopyContentMenuItem from './copy-content-menu-item';

const POPOVER_PROPS = {
	className: 'edit-site-more-menu__content',
	position: 'bottom left',
};
const TOGGLE_PROPS = {
	tooltipPosition: 'bottom',
};

export default function MoreMenu() {
	const [ isModalActive, toggleModal ] = useReducer(
		( isActive ) => ! isActive,
		false
	);

	useShortcut( 'core/edit-site/keyboard-shortcuts', toggleModal );

	return (
		<>
			<DropdownMenu
				className="edit-site-more-menu"
				icon={ moreVertical }
				label={ __( 'More tools & options' ) }
				popoverProps={ POPOVER_PROPS }
				toggleProps={ TOGGLE_PROPS }
			>
				{ ( { onClose } ) => (
					<>
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
							<FeatureToggle
								feature="focusMode"
								label={ __( 'Spotlight mode' ) }
								info={ __( 'Focus on one block at a time' ) }
								messageActivated={ __(
									'Spotlight mode activated'
								) }
								messageDeactivated={ __(
									'Spotlight mode deactivated'
								) }
							/>
							<ActionItem.Slot
								name="core/edit-site/plugin-more-menu"
								label={ __( 'Plugins' ) }
								as={ MenuGroup }
								fillProps={ { onClick: onClose } }
							/>
						</MenuGroup>
						<MenuGroup label={ __( 'Tools' ) }>
							<SiteExport />
							<MenuItem
								onClick={ toggleModal }
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
									'https://wordpress.org/support/article/site-editor/'
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
					</>
				) }
			</DropdownMenu>
			<KeyboardShortcutHelpModal
				isModalActive={ isModalActive }
				toggleModal={ toggleModal }
			/>
		</>
	);
}
