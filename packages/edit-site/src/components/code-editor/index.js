/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { useEntityBlockEditor, useEntityProp } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import CodeEditorTextArea from './code-editor-text-area';

export default function CodeEditor() {
	const { templateType, shortcut } = useSelect( ( select ) => {
		const { getEditedPostType } = select( editSiteStore );
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );
		return {
			templateType: getEditedPostType(),
			shortcut: getShortcutRepresentation( 'core/edit-site/toggle-mode' ),
		};
	}, [] );
	const [ contentStructure, setContent ] = useEntityProp(
		'postType',
		templateType,
		'content'
	);
	const [ blocks, , onChange ] = useEntityBlockEditor(
		'postType',
		templateType
	);
	const content =
		contentStructure instanceof Function
			? contentStructure( { blocks } )
			: contentStructure;
	const { switchEditorMode } = useDispatch( editSiteStore );
	return (
		<div className="edit-site-code-editor">
			<div className="edit-site-code-editor__toolbar">
				<h2>{ __( 'Editing code' ) }</h2>
				<Button
					variant="tertiary"
					onClick={ () => switchEditorMode( 'visual' ) }
					shortcut={ shortcut }
				>
					{ __( 'Exit code editor' ) }
				</Button>
			</div>
			<div className="edit-site-code-editor__body">
				<CodeEditorTextArea
					value={ content }
					onChange={ ( newContent ) => {
						onChange( parse( newContent ), {
							selection: undefined,
						} );
					} }
					onInput={ setContent }
				/>
			</div>
		</div>
	);
}
