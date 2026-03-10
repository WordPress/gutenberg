/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __, sprintf, _n } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

function PostCommentsLinkEdit( { context } ) {
	const { postType, postId } = context;
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

	const post = useSelect(
		( select ) =>
			select( coreStore ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			),
		[ postType, postId ]
	);

	let commentsText;
	if ( commentsCount !== undefined ) {
		const commentsNumber = parseInt( commentsCount );

		if ( commentsNumber === 0 ) {
			commentsText = __( 'No comments' );
		} else {
			commentsText = sprintf(
				/* translators: %s: Number of comments */
				_n( '%s comment', '%s comments', commentsNumber ),
				commentsNumber.toLocaleString()
			);
		}
	}

	return (
		<div { ...blockProps }>
			{ post?.link && commentsText !== undefined ? (
				<a
					href={ post?.link + '#comments' }
					onClick={ ( event ) => event.preventDefault() }
				>
					{ commentsText }
				</a>
			) : (
				<a
					href="#post-comments-link-pseudo-link"
					onClick={ ( event ) => event.preventDefault() }
				>
					{ __( 'No comments' ) }
				</a>
			) }
		</div>
	);
}

export default PostCommentsLinkEdit;
