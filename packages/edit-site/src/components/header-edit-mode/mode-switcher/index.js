/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { editorPrivateApis } from '@wordpress/editor';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { DocumentTools: EditorModeSwitcher } = unlock( editorPrivateApis );

function ModeSwitcher() {
	const { shortcut } = useSelect(
		( select ) => ( {
			shortcut: select(
				keyboardShortcutsStore
			).getShortcutRepresentation( 'core/edit-site/toggle-mode' ),
		} ),
		[]
	);

	return <EditorModeSwitcher shortcut={ shortcut } />;
}

export default ModeSwitcher;
