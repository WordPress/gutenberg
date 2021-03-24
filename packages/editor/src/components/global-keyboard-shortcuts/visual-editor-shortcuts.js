/**
 * WordPress dependencies
 */
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useDispatch } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { BlockEditorKeyboardShortcuts } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import SaveShortcut from './save-shortcut';

function VisualEditorGlobalKeyboardShortcuts() {
	const { redo, undo } = useDispatch( 'core/editor' );

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

export function EditorGlobalKeyboardShortcuts() {
	deprecated( 'EditorGlobalKeyboardShortcuts', {
		since: '5.2',
		alternative: 'VisualEditorGlobalKeyboardShortcuts',
	} );

	return <VisualEditorGlobalKeyboardShortcuts />;
}
