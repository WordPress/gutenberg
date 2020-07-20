/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEntityId } from '@wordpress/core-data';
import { AlignmentToolbar, BlockControls } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

function PostCommentsDisplay( { postId } ) {
	return useSelect(
		( select ) => {
			const comments = select( 'core' ).getEntityRecords(
				'root',
				'comment',
				{
					post: postId,
				}
			);
			// TODO: "No Comments" placeholder should be editable.
			return comments && comments.length
				? comments.map( ( comment ) => (
						<p key={ comment.id }>{ comment.content.raw }</p>
				  ) )
				: __( 'No comments.' );
		},
		[ postId ]
	);
}

export default function PostCommentsEdit( { attributes, setAttributes } ) {
	const { textAlign } = attributes;
	// TODO: Update to handle multiple post types.
	const postId = useEntityId( 'postType', 'post' );
	if ( ! postId ) {
		return __( 'Post Comments' );
	}
	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>

			<div
				className={ classnames( 'wp-block-post-author', {
					[ `has-text-align-${ textAlign }` ]: textAlign,
				} ) }
			>
				<PostCommentsDisplay postId={ postId } />
			</div>
		</>
	);
}
