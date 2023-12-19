/**
 * WordPress dependencies
 */
import { useCallback, useRef, useState } from '@wordpress/element';

export default function usePostHistory( initialPostId, initialPostType ) {
	const postHistory = useRef( [
		{ postId: initialPostId, postType: initialPostType },
	] );
	const [ currentPost, setCurrentPost ] = useState( {
		postId: initialPostId,
		postType: initialPostType,
	} );

	const onSelectPost = useCallback( ( postId, postType ) => {
		postHistory.current.push( { postId, postType } );
		setCurrentPost( { postId, postType } );
	}, [] );

	const goBack =
		postHistory.current.length > 1
			? () => {
					postHistory.current.pop();
					setCurrentPost( [ ...postHistory.current ].pop() );
			  }
			: undefined;

	return { currentPost, onSelectPost, goBack };
}
