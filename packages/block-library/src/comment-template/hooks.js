/**
 * WordPress dependencies
 */
import { useState, useLayoutEffect, useMemo } from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';

/**
 * Return an object with the query args needed to get the comments in the
 * default page.
 *
 * @param {*} param0
 * @return {Object} TODO Write JSDOC.
 */
export const useCommentQueryArgs = ( { context } ) => {
	let { postId, 'comments/perPage': perPage } = context;

	// Initialize the query args that are not going to change.
	const defaultQueryArgs = {
		status: 'approve',
		order: 'asc',
		context: 'embed',
		parent: 0,
		_embed: 'children',
	};

	// Get the Discussion settings that may be needed to query the comments.
	const [ commentsPerPage ] = useEntityProp(
		'root',
		'site',
		'comments_per_page'
	);
	const [ defaultCommentsPage ] = useEntityProp(
		'root',
		'site',
		'default_comments_page'
	);

	// If a block props is not set, use the settings value to generate the
	// appropriate query arg.
	perPage = perPage || commentsPerPage;

	// Create a variable for the default page's number. If the default page is
	// the newest one, the only way to know the page's index is by using the
	// `X-WP-TotalPages` header. In that case, that sadly forces to make an
	// additional request.
	const [ defaultPage, setDefaultPage ] = useState( 1 );
	const [ isDefaultPageKnown, setIsDefaultPageKnown ] = useState(
		defaultCommentsPage !== 'newest'
	);
	const isFirstPage = defaultCommentsPage !== 'newest';

	useLayoutEffect( () => {
		if ( defaultCommentsPage !== 'newest' ) {
			return;
		}
		// Reset the page number as it is going to change.
		setIsDefaultPageKnown( false );
		apiFetch( {
			path: addQueryArgs( '/wp/v2/comments', {
				...defaultQueryArgs,
				post: postId,
				per_page: perPage,
				_fields: 'id', // For performance purposes.
			} ),
			method: 'HEAD', // We only need headers, no body.
			parse: false,
		} ).then( ( res ) => {
			setDefaultPage( parseInt( res.headers.get( 'X-WP-TotalPages' ) ) );
			setIsDefaultPageKnown( true );
		} );
	}, [ defaultCommentsPage, postId, perPage ] );

	// Merge, memoize and return all query arguments, unless the default page's
	// number is not known yet.
	return useMemo( () => {
		if ( isFirstPage ) {
			return {
				...defaultQueryArgs,
				post: postId,
				per_page: perPage,
				page: 1,
			};
		}

		return isDefaultPageKnown
			? {
					...defaultQueryArgs,
					post: postId,
					per_page: perPage,
					page: defaultPage,
			  }
			: null;
	}, [ isDefaultPageKnown, postId, perPage, defaultPage ] );
};

/**
 * Generate a tree structure of comment IDs.
 *
 * @param {*} topLevelComments
 * @return {Object} TODO Write JSDOC.
 */
export const useCommentTree = ( topLevelComments ) => {
	const commentTree = useMemo(
		() =>
			topLevelComments?.map( ( { id, _embedded } ) => {
				const [ children ] = _embedded?.children || [];
				return {
					commentId: id,
					children: children?.map( ( child ) => ( {
						commentId: child.id,
					} ) ),
				};
			} ),
		[ topLevelComments ]
	);

	return { commentTree };
};
