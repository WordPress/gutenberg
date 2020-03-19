/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEntityId } from '@wordpress/core-data';
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

export default function PostCommentsEdit() {
	// TODO: Update to handle multiple post types.
	const postId = useEntityId( 'postType', 'post' );
	if ( ! postId ) {
		return 'Post Comments Placeholder';
	}
	return <PostCommentsDisplay postId={ postId } />;
}
