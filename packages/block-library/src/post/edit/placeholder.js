/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { BlockPreview } from '@wordpress/block-editor';
import { useState, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { Placeholder, TextControl, Button } from '@wordpress/components';

function PostPreview( { postType, postId } ) {
	const [ blocks ] = useEntityBlockEditor( 'postType', postType, {
		id: postId,
	} );
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
	const [ postType, setPostType ] = useState( 'post' );
	const [ postId, setPostId ] = useState();
	const preview = useSelect(
		( select ) => {
			if ( ! postType || ! postId ) {
				return null;
			}
			const post = select( 'core' ).getEntityRecord(
				'postType',
				postType,
				postId
			);
			if ( post ) {
				return <PostPreview postType={ postType } postId={ postId } />;
			}
		},
		[ postType, postId ]
	);
	const choosePost = useCallback(
		() => setAttributes( { postType, postId } ),
		[ postType, postId ]
	);
	return (
		<Placeholder
			icon="media-document"
			label={ __( 'Post' ) }
			instructions={ __( 'Choose a post by post ID.' ) }
		>
			<div className="wp-block-post__placeholder-input-container">
				<TextControl
					label={ __( 'Post Type' ) }
					placeholder={ __( 'post' ) }
					value={ postType }
					onChange={ setPostType }
					className="wp-block-post__placeholder-input"
				/>
				<TextControl
					label={ __( 'Post ID' ) }
					placeholder={ __( '1' ) }
					value={ postId }
					onChange={ setPostId }
					help={ preview === undefined && __( 'Post not found.' ) }
					className="wp-block-post__placeholder-input"
				/>
			</div>
			{ preview }
			<Button
				isPrimary
				disabled={ ! postType || ! postId || ! preview }
				onClick={ choosePost }
			>
				{ __( 'Choose' ) }
			</Button>
		</Placeholder>
	);
}
