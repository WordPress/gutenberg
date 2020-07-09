/**
 * WordPress dependencies
 */
import { useEntityId } from '@wordpress/core-data';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

function PostCommentsCountDisplay( { className } ) {
	const postId = useEntityId( 'postType', 'post' );
	const [ commentsCount, setCommentsCount ] = useState();
	useEffect( () => {
		const currentPostId = postId;
		apiFetch( {
			path: addQueryArgs( '/wp/v2/comments', {
				post: postId,
			} ),
			parse: false,
		} ).then( ( res ) => {
			// Stale requests will have the `currentPostId` of an older closure.
			if ( currentPostId === postId ) {
				setCommentsCount( res.headers.get( 'X-WP-Total' ) );
			}
		} );
	}, [ postId ] );
	return (
		<span className={ className }>
			{ commentsCount !== undefined && commentsCount }
		</span>
	);
}

export default function PostCommentsCountEdit( { className } ) {
	if ( ! useEntityId( 'postType', 'post' ) ) {
		return __( 'Post Comments Count' );
	}
	return <PostCommentsCountDisplay className={ className } />;
}
