import { useDispatch, useSelect } from '@wordpress/data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	store as keyboardShortcutsStore,
	useShortcut,
} from '@wordpress/keyboard-shortcuts';
import { keyboardShortcut } from '@wordpress/keycodes';
import { store as preferencesStore } from '@wordpress/preferences';
import { useViewportMatch } from '@wordpress/compose';
import { unlock } from '../../lock-unlock';

const { FullscreenMode, MoreMenuPreferenceItem, ViewMoreMenuGroup } =
	unlock( editorPrivateApis );

export const PREFERENCE_SCOPE = 'core/boot';
export const PREFERENCE_NAME = 'fullscreenMode';
const SHORTCUT_NAME = 'core/boot/toggle-fullscreen';

/**
 * Returns whether the single-page editor is in fullscreen mode.
 *
 * @return Whether fullscreen mode is on.
 */
export function useIsEditorFullscreenMode() {
	return useSelect(
		( select ) =>
			!! select( preferencesStore ).get(
				PREFERENCE_SCOPE,
				PREFERENCE_NAME
			),
		[]
	);
}

/**
 * Adds fullscreen mode to the single-page editor: the body class that hides
 * the admin menu, a toggle in the editor's options menu, and a shortcut.
 *
 * @param props          Component props.
 * @param props.isActive Whether fullscreen mode is on.
 * @return The fullscreen mode controller and menu item.
 */
export default function EditorFullscreenMode( {
	isActive,
}: {
	isActive: boolean;
} ) {
	const isLargeViewport = useViewportMatch( 'large' );
	const { toggle } = useDispatch( preferencesStore );
	const { registerShortcut, unregisterShortcut } = useDispatch(
		keyboardShortcutsStore
	);

	useEffect( () => {
		registerShortcut( {
			name: SHORTCUT_NAME,
			category: 'global',
			description: __( 'Enable or disable fullscreen mode.' ),
			keyCombination: {
				modifier: 'secondary',
				character: 'f',
			},
		} );

		return () => {
			unregisterShortcut( SHORTCUT_NAME );
		};
	}, [ registerShortcut, unregisterShortcut ] );

	useShortcut( SHORTCUT_NAME, () => {
		toggle( PREFERENCE_SCOPE, PREFERENCE_NAME );
	} );

	return (
		<>
			<FullscreenMode isActive={ isActive } />
			{ isLargeViewport && (
				<ViewMoreMenuGroup>
					<MoreMenuPreferenceItem
						scope={ PREFERENCE_SCOPE }
						name={ PREFERENCE_NAME }
						label={ __( 'Fullscreen mode' ) }
						info={ __( 'Show and hide the admin user interface' ) }
						messageActivated={ __( 'Fullscreen mode activated.' ) }
						messageDeactivated={ __(
							'Fullscreen mode deactivated.'
						) }
						shortcut={ keyboardShortcut.secondary( 'f' ) }
					/>
				</ViewMoreMenuGroup>
			) }
		</>
	);
}
