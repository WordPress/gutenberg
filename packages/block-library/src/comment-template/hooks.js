/**
 * WordPress dependencies
 */
import { useState, useEffect, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';

/**
 * Return an object with the query args needed to get the comments in the
 * default page.
 *
 * @param {*} param0
 * @return {Object} TODO Write JSDOC.
 */
export const useCommentQueryArgs = ( {
	postId,
	perPage,
	defaultPage,
	inherit,
} ) => {
	// Initialize the query args that are not going to change.
	const queryArgs = {
		status: 'approve',
		order: 'asc',
		context: 'embed',
		parent: 0,
		_embed: 'children',
	};

	// Get the Discussion settings that may be needed to query the comments.
	const { commentsPerPage, defaultCommentsPage } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const { __experimentalDiscussionSettings } = getSettings();
		return __experimentalDiscussionSettings;
	} );

	// Overwrite the received attributes if `inherit` is true.
	if ( inherit ) {
		perPage = commentsPerPage;
		defaultPage = defaultCommentsPage;
	}

	// If a block props is not set, use the settings value to generate the
	// appropriate query arg.
	perPage = perPage || commentsPerPage;
	defaultPage = defaultPage || defaultCommentsPage;

	// Get the number of the default page.
	const page = useDefaultPage( {
		defaultCommentsPage: defaultPage,
		postId,
		perPage,
		queryArgs,
	} );

	// Merge, memoize and return all query arguments, unless the default page's
	// number is not known yet.
	return useMemo( () => {
		return page
			? {
					...queryArgs,
					post: postId,
					per_page: perPage,
					page,
			  }
			: null;
	}, [ postId, perPage, page ] );
};

/**
 * Return the index of the default page, depending on whether
 * `defaultCommentsPage` is `newest` or not. If the default page is the newest
 * one, the only way to know the page's index is by using the `X-WP-TotalPages`
 * header. That case sadly forces to make an additional request.
 *
 * @param {*} param0
 * @return {number} Default comments page index.
 */
const useDefaultPage = ( {
	defaultCommentsPage,
	postId,
	perPage,
	queryArgs,
} ) => {
	// Store the default page indices.
	const [ defaultPages, setDefaultPages ] = useState( {} );
	const key = `${ postId }_${ perPage }`;
	const page = defaultPages[ key ] || 0;

	useEffect( () => {
		// Do nothing if the page is already known or not the newest page.
		if ( page || defaultCommentsPage !== 'newest' ) {
			return;
		}
		// We need to fetch comments to know the index. Use HEAD and limit
		// fields just to ID, to make this call as light as possible.
		apiFetch( {
			path: addQueryArgs( '/wp/v2/comments', {
				...queryArgs,
				post: postId,
				per_page: perPage,
				_fields: 'id',
			} ),
			method: 'HEAD',
			parse: false,
		} ).then( ( res ) => {
			setDefaultPages( {
				...defaultPages,
				[ key ]: parseInt( res.headers.get( 'X-WP-TotalPages' ) ),
			} );
		} );
	}, [ defaultCommentsPage, postId, perPage, setDefaultPages ] );

	// The oldest one is always the first one.
	return defaultCommentsPage === 'newest' ? page : 1;
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
