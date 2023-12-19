/**
 * WordPress dependencies
 */
import { useCallback, useRef, useState } from '@wordpress/element';

export default function usePostHistory( initialPostId, initialPostType ) {
	const postHistory = useRef( [] );
	const [ currentPost, setCurrentPost ] = useState( {
		postId: initialPostId,
		postType: initialPostType,
	} );

	const onSelectPost = useCallback(
		( postId, postType ) => {
			postHistory.current.unshift( currentPost );
			setCurrentPost( { postId, postType } );
		},
		[ currentPost ]
	);

	const goBack =
		postHistory.current.length > 0
			? () => {
					const previousPost = postHistory.current.shift();
					setCurrentPost( {
						postId: previousPost.postId
							? previousPost.postId
							: initialPostId,
						postType: previousPost.postType
							? previousPost.postType
							: initialPostType,
					} );
			  }
			: undefined;

	return { currentPost, onSelectPost, goBack };
}
