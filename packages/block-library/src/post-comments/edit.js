/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEntityId } from '@wordpress/core-data';

function PostCommentsDisplay( { postId } ) {
	return useSelect(
		( select ) => {
			const comments = select( 'core' ).getEntityRecords( 'root', 'comment', {
				post: postId,
			} );
			return (
				comments &&
				comments.map( ( comment ) => <p key={ comment.id }>{ comment.content.raw }</p> )
			);
		},
		[ postId ]
	);
}

export default function PostCommentsEdit() {
	const postId = useEntityId( 'postType', 'post' );
	if ( ! postId ) {
		return 'Post Comments Placeholder';
	}
	return <PostCommentsDisplay postId={ postId } />;
}
