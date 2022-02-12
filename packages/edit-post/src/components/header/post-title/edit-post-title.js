/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

export default function EditPostTitle() {
	const { editPost } = useDispatch( editorStore );

	const { postTitle } = useSelect(
		( select ) => ( {
			postTitle: select( editorStore ).getEditedPostAttribute( 'title' ),
		} ),
		[]
	);

	return (
		<div className="edit-post-title-panel">
			<TextControl
				label={ __( 'Title' ) }
				value={ postTitle ?? '' }
				min={ 1 }
				onChange={ ( newTitle ) => editPost( { title: newTitle } ) }
			/>
		</div>
	);
}
