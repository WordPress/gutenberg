/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { CodeEditor } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostTextEditor() {
	const postContent = useSelect(
		( select ) => select( editorStore ).getEditedPostContent(),
		[]
	);
	const { editPost, resetEditorBlocks } = useDispatch( editorStore );
	return (
		<CodeEditor
			value={ postContent }
			onInput={ ( newContent ) => editPost( { content: newContent } ) }
			onChange={ ( newContent ) => {
				const blocks = parse( newContent );
				resetEditorBlocks( blocks );
			} }
		/>
	);
}
