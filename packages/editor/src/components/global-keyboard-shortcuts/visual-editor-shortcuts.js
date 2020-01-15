/**
 * WordPress dependencies
 */
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useDispatch, useSelect } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { BlockEditorKeyboardShortcuts } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import SaveShortcut from './save-shortcut';

function VisualEditorGlobalKeyboardShortcuts() {
	const { redo, undo, savePost } = useDispatch( 'core/editor' );
	const isEditedPostDirty = useSelect( ( select ) => select( 'core/editor' ).isEditedPostDirty, [] );

	useShortcut( 'core/editor/undo', ( event ) => {
		undo();
		event.preventDefault();
	}, { bindGlobal: true } );

	useShortcut( 'core/editor/redo', ( event ) => {
		redo();
		event.preventDefault();
	}, { bindGlobal: true } );

	useShortcut( 'core/editor/save', ( event ) => {
		event.preventDefault();

		// TODO: This should be handled in the `savePost` effect in
		// considering `isSaveable`. See note on `isEditedPostSaveable`
		// selector about dirtiness and meta-boxes.
		//
		// See: `isEditedPostSaveable`
		if ( ! isEditedPostDirty() ) {
			return;
		}

		savePost();
	}, { bindGlobal: true } );

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
		alternative: 'VisualEditorGlobalKeyboardShortcuts',
		plugin: 'Gutenberg',
	} );

	return <VisualEditorGlobalKeyboardShortcuts />;
}
