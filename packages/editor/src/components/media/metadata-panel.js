/**
 * WordPress dependencies
 */
import { MediaEditorProvider, MediaForm } from '@wordpress/media-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import usePostFields from '../post-fields';
import PostCardPanel from '../post-card-panel';
import PostPanelSection from '../post-panel-section';

/**
 * Media metadata panel for the editor sidebar.
 * Displays a form for editing media properties with PostCardPanel header.
 *
 * @param {Object}   props                   - Component props.
 * @param {Function} props.onActionPerformed - Callback when an action is performed.
 * @return {Element} The MediaMetadataPanel component.
 */
export default function MediaMetadataPanel( { onActionPerformed } ) {
	const { media, isLoading, postType, postId } = useSelect( ( select ) => {
		const _postType = select( editorStore ).getCurrentPostType();
		const _postId = select( editorStore ).getCurrentPostId();
		const currentPost = select( coreStore ).getEditedEntityRecord(
			'postType',
			_postType,
			_postId
		);
		return {
			media: currentPost,
			isLoading: ! currentPost,
			postType: _postType,
			postId: _postId,
		};
	}, [] );

	const { editPost } = useDispatch( editorStore );
	const fields = usePostFields( { postType: 'attachment' } );

	const handleUpdate = ( updates ) => {
		editPost( updates );
	};

	return (
		<PostPanelSection className="editor-media-metadata-panel">
			<MediaEditorProvider
				media={ media }
				fields={ fields }
				onUpdate={ handleUpdate }
				isLoading={ isLoading }
			>
				<MediaForm
					header={
						<PostCardPanel
							postType={ postType }
							postId={ postId }
							onActionPerformed={ onActionPerformed }
						/>
					}
				/>
			</MediaEditorProvider>
		</PostPanelSection>
	);
}
