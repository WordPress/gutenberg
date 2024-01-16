/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const { ModeSwitcher: EditorModeSwitcher } = unlock( editorPrivateApis );

function ModeSwitcher() {
	const shortcut = useSelect(
		( select ) =>
			select( keyboardShortcutsStore ).getShortcutRepresentation(
				'core/edit-site/toggle-mode'
			),
		[]
	);

	return <EditorModeSwitcher shortcut={ shortcut } />;
}

export default ModeSwitcher;
