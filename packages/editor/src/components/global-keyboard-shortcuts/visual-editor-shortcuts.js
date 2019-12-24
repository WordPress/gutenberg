/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useDispatch, useSelect } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { BlockEditorKeyboardShortcuts } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

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

	return null;
}

function VisualEditorKeyboardShortcutsRegister() {
	// Registering the shortcuts
	const { registerShortcut } = useDispatch( 'core/keyboard-shortcuts' );
	useEffect( () => {
		registerShortcut( {
			name: 'core/editor/save',
			category: 'global',
			description: __( 'Save your changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 's',
			},
		} );

		registerShortcut( {
			name: 'core/editor/undo',
			category: 'global',
			description: __( 'Undo your last changes.' ),
			keyCombination: {
				modifier: 'primary',
				character: 'z',
			},
		} );

		registerShortcut( {
			name: 'core/editor/redo',
			category: 'global',
			description: __( 'Redo your last undo.' ),
			keyCombination: {
				modifier: 'primaryShift',
				character: 'z',
			},
		} );
	}, [ registerShortcut ] );

	return <BlockEditorKeyboardShortcuts.Register />;
}

VisualEditorGlobalKeyboardShortcuts.Register = VisualEditorKeyboardShortcutsRegister;

export default VisualEditorGlobalKeyboardShortcuts;

export function EditorGlobalKeyboardShortcuts() {
	deprecated( 'EditorGlobalKeyboardShortcuts', {
		alternative: 'VisualEditorGlobalKeyboardShortcuts',
		plugin: 'Gutenberg',
	} );

	return <VisualEditorGlobalKeyboardShortcuts />;
}
