/**
 * WordPress dependencies
 */
import { PlainText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { store as editorStore } from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';

function PostTitle() {
	const { editPost } = useDispatch( editorStore );
	const postTitle = useSelect(
		( select ) => select( editorStore ).getEditedPostAttribute( 'title' ),
		[]
	);
	return (
		<PlainText
			tagName="h1"
			placeholder={ __( 'Add title' ) }
			value={ postTitle }
			onChange={ ( title ) => editPost( { title } ) }
			__experimentalVersion={ 2 }
		/>
	);
}

export default PostTitle;
