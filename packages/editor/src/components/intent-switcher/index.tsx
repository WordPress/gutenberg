import { __ } from '@wordpress/i18n';
import { MenuItemsChoice, MenuGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { displayShortcut } from '@wordpress/keycodes';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import {
	EDITOR_INTENT_EDIT,
	EDITOR_INTENT_SUGGEST,
	EDITOR_INTENT_VIEW,
} from '../../store/constants';
import PostTypeSupportCheck from '../post-type-support-check';

/**
 * Available editor intent options surfaced in the more-menu mode picker.
 *
 * Each option is mirrored across three files; keep them in sync when adding
 * or renaming an intent:
 *   - This file: UI label, description, and shortcut hint.
 *   - `../global-keyboard-shortcuts/register-shortcuts.js`: registers the
 *     keyboard binding with `@wordpress/keyboard-shortcuts`.
 *   - `../global-keyboard-shortcuts/index.js`: wires `useShortcut` so the
 *     binding dispatches `setEditorIntent`.
 *
 * The `value` field must be one of the `EDITOR_INTENT_*` constants — the
 * `setEditorIntent` action validates against `EDITOR_INTENTS` and silently
 * ignores unknown values.
 */
const INTENTS: Array< {
	value: string;
	label: string;
	info: string;
	shortcut: string;
} > = [
	{
		value: EDITOR_INTENT_EDIT,
		label: __( 'Editing' ),
		info: __( 'Edit content directly.' ),
		shortcut: displayShortcut.secondary( 'z' ),
	},
	{
		value: EDITOR_INTENT_SUGGEST,
		label: __( 'Suggesting' ),
		info: __( 'Propose changes the author can apply or reject.' ),
		shortcut: displayShortcut.secondary( 'x' ),
	},
	{
		value: EDITOR_INTENT_VIEW,
		label: __( 'Viewing' ),
		info: __( 'Read-only preview of the content.' ),
		shortcut: displayShortcut.secondary( 'c' ),
	},
];

/**
 * Editor intent switcher. Lets the user pick between direct editing,
 * suggesting changes, or viewing in read-only. Only rendered for post
 * types that declare the `editor.notes` support.
 */
function IntentSwitcher() {
	// The intent API is private while Suggest mode is experimental.
	const { intent, isRichEditingEnabled } = useSelect(
		( select ) => ( {
			intent: unlock( select( editorStore ) ).getEditorIntent(),
			isRichEditingEnabled:
				select( editorStore ).getEditorSettings().richEditingEnabled,
		} ),
		[]
	);
	const { setEditorIntent } = unlock( useDispatch( editorStore ) );

	/*
	 * Suggesting is visual-only - a suggestion is an inline marker in block
	 * content, which the code editor cannot render - so it is unavailable to
	 * a user who turned the visual editor off. `setEditorIntent` refuses it
	 * either way; offering it disabled, with the setting to change, beats a
	 * choice that looks live and then declines.
	 */
	const choices = INTENTS.map( ( choice ) =>
		choice.value === EDITOR_INTENT_SUGGEST && ! isRichEditingEnabled
			? {
					...choice,
					disabled: true,
					info: __(
						'You can enable the visual editor in your profile settings.'
					),
			  }
			: choice
	);

	return (
		<PostTypeSupportCheck supportKeys="editor.notes">
			<MenuGroup label={ __( 'Mode' ) }>
				<MenuItemsChoice
					choices={ choices }
					value={ intent }
					onSelect={ setEditorIntent }
				/>
			</MenuGroup>
		</PostTypeSupportCheck>
	);
}

export default IntentSwitcher;
