/**
 * WordPress dependencies
 */
import { PostTextEditor, PostTitle } from '@wordpress/editor';
import { IconButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { displayShortcut } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import './style.scss';

function TextEditor() {
	return (
		<div className="edit-post-text-editor">
			<div className="edit-post-text-editor__toolbar">
				<h2>{ __( 'Editing Code' ) }</h2>
				<IconButton
					//onClick={ onSave }
					icon="no-alt"
					shortcut={ displayShortcut.secondary( 'm' ) }
				>
					{ __( 'Exit Code Editor' ) }
				</IconButton>
			</div>
			<div className="edit-post-text-editor__body">
				<PostTitle />
				<PostTextEditor />
			</div>
		</div>
	);
}

export default TextEditor;
