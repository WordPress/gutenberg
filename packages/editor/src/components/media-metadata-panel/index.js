/**
 * WordPress dependencies
 */
import { DataForm } from '@wordpress/dataviews';
import { useSelect, useDispatch } from '@wordpress/data';
import { Spinner, __experimentalVStack as VStack } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import usePostFields from '../post-fields';
import PostCardPanel from '../post-card-panel';
import PostPanelSection from '../post-panel-section';

export default function MediaMetadataPanel( { onActionPerformed } ) {
	const { editedPost, isLoading, postType, postId } = useSelect(
		( select ) => {
			const _postType = select( editorStore ).getCurrentPostType();
			const _postId = select( editorStore ).getCurrentPostId();
			const currentPost = select( coreStore ).getEditedEntityRecord(
				'postType',
				_postType,
				_postId
			);
			return {
				editedPost: currentPost,
				isLoading: ! currentPost,
				postType: _postType,
				postId: _postId,
			};
		},
		[]
	);

	const { editPost } = useDispatch( editorStore );

	// Get fields registered for attachment post type
	// This triggers registerPostTypeSchema( 'attachment' ) via usePostFields
	const fields = usePostFields( { postType: 'attachment' } );

	if ( isLoading ) {
		return (
			<div className="editor-media-metadata-panel editor-media-metadata-panel--loading">
				<Spinner />
			</div>
		);
	}

	// Create a form structure with panel layout and per-field overrides
	// Fields like title, alt_text, caption, and description use 'regular' layout
	// while others inherit the panel layout (which collapses them)
	const form = {
		layout: {
			type: 'panel',
		},
		fields: fields.map( ( field ) => {
			// Use regular layout with top labels for large text fields
			if (
				[ 'title', 'alt_text', 'caption', 'description' ].includes(
					field.id
				)
			) {
				return {
					id: field.id,
					layout: {
						type: 'regular',
						labelPosition: 'top',
					},
				};
			}
			// All other fields inherit the panel layout
			return field.id;
		} ),
	};

	return (
		<PostPanelSection className="editor-media-metadata-panel">
			<VStack spacing={ 4 }>
				<PostCardPanel
					postType={ postType }
					postId={ postId }
					onActionPerformed={ onActionPerformed }
				/>
				<DataForm
					data={ editedPost }
					fields={ fields }
					form={ form }
					onChange={ ( updates ) => {
						editPost( updates );
					} }
				/>
			</VStack>
		</PostPanelSection>
	);
}
