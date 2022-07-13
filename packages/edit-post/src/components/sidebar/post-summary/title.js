/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { PlainText } from '@wordpress/block-editor';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

export default function PostSummaryTitle() {
	const { title, titlePlaceholder } = useSelect(
		( select ) => ( {
			title: select( editorStore ).getEditedPostAttribute( 'title' ),
			titlePlaceholder:
				select( editorStore ).getEditorSettings().titlePlaceholder,
		} ),
		[]
	);

	const { editPost } = useDispatch( editorStore );

	return (
		<PlainText
			__experimentalVersion={ 2 }
			className="edit-post-post-summary__title"
			placeholder={
				decodeEntities( titlePlaceholder ) || __( 'Add title' )
			}
			disableLineBreaks
			value={ title }
			onChange={ ( value ) => editPost( { title: value } ) }
		/>
	);
}
