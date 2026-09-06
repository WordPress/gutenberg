import { __, _x } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as interfaceStore, ActionItem } from '@wordpress/interface';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import CopyContentMenuItem from './copy-content-menu-item';
import MoreMenuItem from './more-menu-item';
import ModeSwitcher from '../mode-switcher';
import MoreMenuGroup from './more-menu-group';
import MoreMenuPreferenceItem from './more-menu-preference-item';
import ToolsMoreMenuGroup from './tools-more-menu-group';
import ViewMoreMenuGroup from './view-more-menu-group';
import { store as editorStore } from '../../store';
import { getKeyboardShortcut } from '../../utils/keyboard-shortcut';

const DISTRACTION_FREE_SHORTCUT = getKeyboardShortcut( {
	character: '\\',
	modifier: 'primaryShift',
} );
const KEYBOARD_SHORTCUTS_SHORTCUT = getKeyboardShortcut( {
	character: 'h',
	modifier: 'access',
} );

export default function MoreMenu( { isRevisionMode = false } ) {
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

	const trigger = (
		<Menu.Trigger
			render={
				<Button
					size="compact"
					icon={ moreVertical }
					label={ __( 'Options' ) }
					showTooltip={ ! showIconLabels }
					tooltipPosition="bottom"
					variant={ showIconLabels ? 'tertiary' : undefined }
				/>
			}
		/>
	);
	const positioner = <Menu.Positioner align="end" />;

	if ( isRevisionMode ) {
		return (
			<Menu.Root modal={ false }>
				{ trigger }
				<Menu.Popup
					className="editor-more-menu__popup"
					positioner={ positioner }
				>
					<ModeSwitcher />
				</Menu.Popup>
			</Menu.Root>
		);
	}

	return (
		<Menu.Root modal={ false }>
			{ trigger }
			<Menu.Popup
				className="editor-more-menu__popup"
				positioner={ positioner }
			>
				<Menu.Group>
					<Menu.GroupLabel>{ _x( 'View', 'noun' ) }</Menu.GroupLabel>
					<MoreMenuPreferenceItem
						scope="core"
						name="fixedToolbar"
						onToggle={ turnOffDistractionFree }
						label={ __( 'Top toolbar' ) }
						info={ __(
							'Access all block and document tools in a single place'
						) }
						messageActivated={ __( 'Top toolbar activated.' ) }
						messageDeactivated={ __( 'Top toolbar deactivated.' ) }
					/>
					<MoreMenuPreferenceItem
						scope="core"
						name="distractionFree"
						label={ __( 'Distraction free' ) }
						info={ __( 'Write with calmness' ) }
						handleToggling={ false }
						onToggle={ () =>
							toggleDistractionFree( { createNotice: false } )
						}
						messageActivated={ __(
							'Distraction free mode activated.'
						) }
						messageDeactivated={ __(
							'Distraction free mode deactivated.'
						) }
						shortcut={ DISTRACTION_FREE_SHORTCUT }
					/>
					<MoreMenuPreferenceItem
						scope="core"
						name="focusMode"
						label={ __( 'Spotlight mode' ) }
						info={ __( 'Focus on one block at a time' ) }
						messageActivated={ __( 'Spotlight mode activated.' ) }
						messageDeactivated={ __(
							'Spotlight mode deactivated.'
						) }
					/>
					<ViewMoreMenuGroup.Slot />
				</Menu.Group>
				<Menu.Separator />
				<ModeSwitcher />
				<ActionItem.Slot
					name="core/plugin-more-menu"
					fillProps={ { as: MoreMenuItem } }
				>
					{ ( items ) => (
						<MoreMenuGroup label={ __( 'Panels' ) }>
							{ items }
						</MoreMenuGroup>
					) }
				</ActionItem.Slot>
				<Menu.Separator />
				<Menu.Group>
					<Menu.GroupLabel>{ __( 'Tools' ) }</Menu.GroupLabel>
					<Menu.Item
						onClick={ () =>
							openModal( 'editor/keyboard-shortcut-help' )
						}
						shortcut={ KEYBOARD_SHORTCUTS_SHORTCUT }
					>
						<Menu.ItemLabel>
							{ __( 'Keyboard shortcuts' ) }
						</Menu.ItemLabel>
					</Menu.Item>
					<CopyContentMenuItem />
					<Menu.LinkItem
						href={ __(
							'https://wordpress.org/documentation/article/wordpress-block-editor/'
						) }
						openInNewTab
					>
						<Menu.ItemLabel>{ __( 'Help' ) }</Menu.ItemLabel>
					</Menu.LinkItem>
					<ToolsMoreMenuGroup.Slot />
				</Menu.Group>
				<Menu.Separator />
				<Menu.Item onClick={ () => openModal( 'editor/preferences' ) }>
					<Menu.ItemLabel>{ __( 'Preferences' ) }</Menu.ItemLabel>
				</Menu.Item>
			</Menu.Popup>
		</Menu.Root>
	);
}
