/**
 * WordPress dependencies
 */
import {
	CodeEditorScreen,
	CodeEditor as InterfaceCodeEditor,
} from '@wordpress/interface';
import { parse } from '@wordpress/blocks';
import { useEntityBlockEditor, useEntityProp } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

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
		<CodeEditorScreen
			onExit={ () => switchEditorMode( 'visual' ) }
			exitShortcut={ shortcut }
		>
			<InterfaceCodeEditor
				value={ content }
				onChange={ ( newContent ) => {
					onChange( parse( newContent ), { selection: undefined } );
				} }
				onInput={ setContent }
			/>
		</CodeEditorScreen>
	);
}
