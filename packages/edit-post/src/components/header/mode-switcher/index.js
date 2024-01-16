/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { editorPrivateApis, store as editorStore } from '@wordpress/editor';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { DocumentTools: EditorModeSwitcher } = unlock( editorPrivateApis );

function ModeSwitcher() {
	const { shortcut, isRichEditingEnabled, isCodeEditingEnabled } = useSelect(
		( select ) => ( {
			shortcut: select(
				keyboardShortcutsStore
			).getShortcutRepresentation( 'core/edit-post/toggle-mode' ),
			isRichEditingEnabled:
				select( editorStore ).getEditorSettings().richEditingEnabled,
			isCodeEditingEnabled:
				select( editorStore ).getEditorSettings().codeEditingEnabled,
		} ),
		[]
	);

	return (
		<EditorModeSwitcher
			shortcut={ shortcut }
			isRichEditingEnabled={ isRichEditingEnabled }
			isCodeEditingEnabled={ isCodeEditingEnabled }
		/>
	);
}

export default ModeSwitcher;
