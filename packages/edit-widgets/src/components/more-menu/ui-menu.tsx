import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';
import { keyboardShortcut } from '@wordpress/keycodes';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useViewportMatch } from '@wordpress/compose';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';
import MoreMenuPreferenceItem from './more-menu-preference-item';
import KeyboardShortcutHelpModal from '../keyboard-shortcut-help-modal';

export default function MoreMenuWithUI() {
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
	const { toggle } = useDispatch( preferencesStore );

	return (
		<>
			<Menu.Root modal={ false }>
				<Menu.Trigger
					render={
						<Button
							size="compact"
							icon={ moreVertical }
							label={ __( 'Options' ) }
							showTooltip
							tooltipPosition="bottom"
						/>
					}
				/>
				<Menu.Popup positioner={ <Menu.Positioner align="end" /> }>
					{ isLargeViewport && (
						<>
							<Menu.Group>
								<Menu.GroupLabel>
									{ _x( 'View', 'noun' ) }
								</Menu.GroupLabel>
								<MoreMenuPreferenceItem
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
							</Menu.Group>
							<Menu.Separator />
						</>
					) }
					<Menu.Group>
						<Menu.GroupLabel>{ __( 'Tools' ) }</Menu.GroupLabel>
						<Menu.Item
							onClick={ () => {
								setIsKeyboardShortcutsModalVisible( true );
							} }
							shortcut={ keyboardShortcut.access( 'h' ) }
						>
							<Menu.ItemLabel>
								{ __( 'Keyboard shortcuts' ) }
							</Menu.ItemLabel>
						</Menu.Item>
						<Menu.Item
							onClick={ () =>
								toggle( 'core/edit-widgets', 'welcomeGuide' )
							}
							aria-haspopup="dialog"
						>
							<Menu.ItemLabel>
								{ __( 'Welcome Guide' ) }
							</Menu.ItemLabel>
						</Menu.Item>
						<Menu.LinkItem
							href={ __(
								'https://wordpress.org/documentation/article/block-based-widgets-editor/'
							) }
							openInNewTab
							rel="noopener"
						>
							<Menu.ItemLabel>{ __( 'Help' ) }</Menu.ItemLabel>
						</Menu.LinkItem>
					</Menu.Group>
					<Menu.Separator />
					<Menu.Group>
						<Menu.GroupLabel>
							{ __( 'Preferences' ) }
						</Menu.GroupLabel>
						<MoreMenuPreferenceItem
							scope="core/edit-widgets"
							name="keepCaretInsideBlock"
							label={ __( 'Contain text cursor inside block' ) }
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
						<MoreMenuPreferenceItem
							scope="core/edit-widgets"
							name="themeStyles"
							info={ __(
								'Make the editor look like your theme.'
							) }
							label={ __( 'Use theme styles' ) }
						/>
						{ isLargeViewport && (
							<MoreMenuPreferenceItem
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
					</Menu.Group>
				</Menu.Popup>
			</Menu.Root>
			<KeyboardShortcutHelpModal
				isModalActive={ isKeyboardShortcutsModalActive }
				toggleModal={ toggleKeyboardShortcutsModal }
			/>
		</>
	);
}
