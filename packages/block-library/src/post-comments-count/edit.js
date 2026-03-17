/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

export default function PostCommentsCountEdit( { context } ) {
	const { postId } = context;
	const [ commentsCount, setCommentsCount ] = useState();

	const blockProps = useBlockProps();

	useEffect( () => {
		if ( ! postId ) {
			return;
		}

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

	const hasPostAndComments = postId && commentsCount !== undefined;

	const blockStyles = {
		...blockProps.style,
		textDecoration: hasPostAndComments
			? blockProps.style?.textDecoration
			: undefined,
	};

	return (
		<div { ...blockProps } style={ blockStyles }>
			{ hasPostAndComments ? commentsCount : '0' }
		</div>
	);
}
