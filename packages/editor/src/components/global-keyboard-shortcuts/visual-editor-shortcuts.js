/**
 * WordPress dependencies
 */
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useDispatch } from '@wordpress/data';
import { BlockEditorKeyboardShortcuts } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import SaveShortcut from './save-shortcut';
import { store as editorStore } from '../../store';

function VisualEditorGlobalKeyboardShortcuts() {
	const { redo, undo } = useDispatch( editorStore );

	useShortcut(
		'core/editor/undo',
		( event ) => {
			undo();
			event.preventDefault();
		},
		{ bindGlobal: true }
	);

	useShortcut(
		'core/editor/redo',
		( event ) => {
			redo();
			event.preventDefault();
		},
		{ bindGlobal: true }
	);

	return (
		<>
			<BlockEditorKeyboardShortcuts />
			<SaveShortcut />
		</>
	);
}

export default VisualEditorGlobalKeyboardShortcuts;
