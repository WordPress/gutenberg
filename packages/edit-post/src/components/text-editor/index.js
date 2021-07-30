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
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { displayShortcut } from '@wordpress/keycodes';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

function TextEditor( { onExit, isRichEditingEnabled } ) {
	return (
		<div className="edit-post-text-editor">
			{ isRichEditingEnabled && (
				<div className="edit-post-text-editor__toolbar">
					<h2>{ __( 'Editing code' ) }</h2>
					<Button
						variant="tertiary"
						onClick={ onExit }
						shortcut={ displayShortcut.secondary( 'm' ) }
					>
						{ __( 'Exit code editor' ) }
					</Button>
					<TextEditorGlobalKeyboardShortcuts />
				</div>
			) }
			<div className="edit-post-text-editor__body">
				<PostTitle />
				<PostTextEditor />
			</div>
		</div>
	);
}

export default compose(
	withSelect( ( select ) => ( {
		isRichEditingEnabled: select( editorStore ).getEditorSettings()
			.richEditingEnabled,
	} ) ),
	withDispatch( ( dispatch ) => {
		return {
			onExit() {
				dispatch( editPostStore ).switchEditorMode( 'visual' );
			},
		};
	} )
)( TextEditor );
