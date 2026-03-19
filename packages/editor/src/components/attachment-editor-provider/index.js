/**
 * WordPress dependencies
 */
import { MediaEditorProvider } from '@wordpress/media-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { ATTACHMENT_POST_TYPE } from '../../store/constants';

/**
 * Provides MediaEditor context for attachment post types.
 * Wraps both the editor content and sidebar so they can share editing state.
 * MediaEditorProvider automatically provides ImageCropper context for image attachments.
 *
 * @param {Object} props          - Component props
 * @param {*}      props.children - Child components
 * @return {Element} Provider component or passthrough for non-attachments
 */
export default function AttachmentEditorProvider( { children } ) {
	const { media, isAttachment } = useSelect( ( select ) => {
		const _postType = select( editorStore ).getCurrentPostType();
		const _postId = select( editorStore ).getCurrentPostId();
		const _isAttachment =
			_postType === ATTACHMENT_POST_TYPE &&
			window?.__experimentalMediaEditor;

		let currentPost = null;
		if ( _isAttachment ) {
			currentPost = select( coreStore ).getEditedEntityRecord(
				'postType',
				_postType,
				_postId
			);
		}

		return {
			media: currentPost,
			isAttachment: _isAttachment,
		};
	}, [] );

	const { editPost } = useDispatch( editorStore );

	const handleUpdate = ( updates ) => {
		editPost( updates );
	};

	// Only wrap with provider for attachments
	if ( ! isAttachment ) {
		return children;
	}

	return (
		<MediaEditorProvider value={ media } onChange={ handleUpdate }>
			{ children }
		</MediaEditorProvider>
	);
}
