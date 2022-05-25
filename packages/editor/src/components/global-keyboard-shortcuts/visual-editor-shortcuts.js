/**
 * WordPress dependencies
 */
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import SaveShortcut from './save-shortcut';
import { store as editorStore } from '../../store';

function VisualEditorGlobalKeyboardShortcuts() {
	const { redo, undo } = useDispatch( editorStore );

	useShortcut( 'core/editor/undo', ( event ) => {
		undo();
		event.preventDefault();
	} );

	useShortcut( 'core/editor/redo', ( event ) => {
		redo();
		event.preventDefault();
	} );

	return <SaveShortcut />;
}

export default VisualEditorGlobalKeyboardShortcuts;
