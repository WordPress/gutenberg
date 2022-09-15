/**
 * WordPress dependencies
 */
import {
	PostTextEditor,
	PostTitle,
	TextEditorGlobalKeyboardShortcuts,
	store as editorStore,
} from '@wordpress/editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { displayShortcut } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

export default function TextEditor() {
	const isRichEditingEnabled = useSelect( ( select ) => {
		return select( editorStore ).getEditorSettings().richEditingEnabled;
	}, [] );
	const { switchEditorMode } = useDispatch( editPostStore );

	return (
		<div className="edit-post-text-editor">
			<TextEditorGlobalKeyboardShortcuts />
			{ isRichEditingEnabled && (
				<div className="edit-post-text-editor__toolbar">
					<h2>{ __( 'Editing code' ) }</h2>
					<Button
						variant="tertiary"
						onClick={ () => switchEditorMode( 'visual' ) }
						shortcut={ displayShortcut.secondary( 'm' ) }
					>
						{ __( 'Exit code editor' ) }
					</Button>
				</div>
			) }
			<div className="edit-post-text-editor__body">
				<PostTitle />
				<PostTextEditor />
			</div>
		</div>
	);
}
