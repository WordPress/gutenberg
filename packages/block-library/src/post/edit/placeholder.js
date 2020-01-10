/**
 * WordPress dependencies
 */
import { useEntityBlockEditor, EntityProvider } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { BlockPreview } from '@wordpress/block-editor';
import { useState, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { Placeholder, TextControl, Button } from '@wordpress/components';

function PostPreview() {
	const [ blocks ] = useEntityBlockEditor( 'postType', 'post' );
	return (
		<div className="wp-block-post__placeholder-preview">
			<div className="wp-block-post__placeholder-preview-title">
				{ __( 'Preview' ) }
			</div>
			<BlockPreview blocks={ blocks } />
		</div>
	);
}

export default function PostPlaceholder( { setAttributes } ) {
	const [ postId, setPostId ] = useState();
	const preview = useSelect(
		( select ) => {
			if ( ! postId ) {
				return null;
			}
			const post = select( 'core' ).getEntityRecord( 'postType', 'post', postId );
			if ( post ) {
				return (
					<EntityProvider kind="postType" type="post" id={ postId }>
						<PostPreview />
					</EntityProvider>
				);
			}
		},
		[ postId ]
	);
	const choosePostId = useCallback( () => setAttributes( { postId } ), [ postId ] );
	return (
		<Placeholder
			icon="media-document"
			label={ __( 'Post' ) }
			instructions={ __( 'Choose a post by post ID.' ) }
		>
			<div className="wp-block-post__placeholder-input-container">
				<TextControl
					label={ __( 'Post ID' ) }
					placeholder={ __( '1' ) }
					value={ postId }
					onChange={ setPostId }
					help={ preview === undefined && __( 'Post not found.' ) }
				/>
			</div>
			{ preview }
			<Button isPrimary disabled={ ! postId || ! preview } onClick={ choosePostId }>
				{ __( 'Choose' ) }
			</Button>
		</Placeholder>
	);
}
