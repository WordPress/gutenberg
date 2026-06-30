/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItemsChoice, MenuGroup } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { displayShortcut } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
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
 *
 * @type {Array<{value: string, label: string, info: string, shortcut: string}>}
 */
const INTENTS = [
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
	const intent = useSelect(
		( select ) => select( editorStore ).getEditorIntent(),
		[]
	);
	const { setEditorIntent } = useDispatch( editorStore );

	return (
		<PostTypeSupportCheck supportKeys="editor.notes">
			<MenuGroup label={ __( 'Mode' ) }>
				<MenuItemsChoice
					choices={ INTENTS }
					value={ intent }
					onSelect={ setEditorIntent }
				/>
			</MenuGroup>
		</PostTypeSupportCheck>
	);
}

export default IntentSwitcher;
