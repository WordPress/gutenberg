/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { PlainText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function PostExcerptField() {
	const excerpt = useSelect(
		( select ) => select( editorStore ).getEditedPostAttribute( 'excerpt' ),
		[]
	);

	const { editPost } = useDispatch( editorStore );

	return (
		<PlainText
			__experimentalVersion={ 2 }
			className="edit-post-post-excerpt__field"
			placeholder={ __( 'Add excerpt' ) }
			value={ excerpt }
			onChange={ ( value ) => editPost( { excerpt: value } ) }
		/>
	);
}
