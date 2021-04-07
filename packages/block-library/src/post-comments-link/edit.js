/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	AlignmentToolbar,
	BlockControls,
	Warning,
	useBlockProps,
} from '@wordpress/block-editor';
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __, sprintf } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';

function PostCommentsLinkEdit( { context, attributes, setAttributes } ) {
	const { textAlign } = attributes;
	const { postType, postId } = context;
	const [ commentsCount, setCommentsCount ] = useState();

	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

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

	if ( ! post ) {
		return null;
	}

	const { link } = post;

	let commentsText;
	if ( commentsCount !== undefined ) {
		if ( commentsCount === '0' ) {
			commentsText = __( 'No comments' );
		} else if ( commentsCount === '1' ) {
			commentsText = __( 'One comment' );
		} else {
			commentsText = sprintf(
				/* translators: %d Number of comments */
				__( '%d comments' ),
				commentsCount
			);
		}
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

			<div { ...blockProps }>
				{ link && commentsText !== undefined ? (
					<a
						href={ link + '#comments' }
						onClick={ ( event ) => event.preventDefault() }
					>
						{ commentsText }
					</a>
				) : (
					<Warning>
						{ __( 'Post Comments Link block: post not found.' ) }
					</Warning>
				) }
			</div>
		</>
	);
}

export default PostCommentsLinkEdit;
