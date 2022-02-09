/**
 * WordPress dependencies
 */
import { useState, useEffect, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';

/**
 * Return an object with the query args needed to fetch the default page of
 * comments.
 *
 * @param {Object}  props             Hook props.
 * @param {number}  props.postId      ID of the post that contains the comments.
 * @param {number}  props.perPage     The number of comments included per page.
 * @param {string}  props.defaultPage Page shown by default (newest/oldest).
 * @param {boolean} props.inherit     Overwrite props with values from WP
 *                                    discussion settings.
 *
 * @return {Object} Query args to retrieve the comments.
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
	const page = useDefaultPageIndex( {
		defaultPage,
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
 * Return the index of the default page, depending on whether `defaultPage` is
 * `newest` or `oldest`. In the first case, the only way to know the page's
 * index is by using the `X-WP-TotalPages` header, which forces to make an
 * additional request.
 *
 * @param {Object} props             Hook props.
 * @param {string} props.defaultPage Page shown by default (newest/oldest).
 * @param {number} props.postId      ID of the post that contains the comments.
 * @param {number} props.perPage     The number of comments included per page.
 * @param {Object} props.queryArgs   Other query args.
 *
 * @return {number} Index of the default comments page.
 */
const useDefaultPageIndex = ( { defaultPage, postId, perPage, queryArgs } ) => {
	// Store the default page indices.
	const [ defaultPages, setDefaultPages ] = useState( {} );
	const key = `${ postId }_${ perPage }`;
	const page = defaultPages[ key ] || 0;

	useEffect( () => {
		// Do nothing if the page is already known or not the newest page.
		if ( page || defaultPage !== 'newest' ) {
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
	}, [ defaultPage, postId, perPage, setDefaultPages ] );

	// The oldest one is always the first one.
	return defaultPage === 'newest' ? page : 1;
};

/**
 * Generate a tree structure of comment IDs from a list of comment entities. The
 * children of each comment are obtained from `_embedded`.
 *
 * @typedef {{ commentId: number, children: CommentNode }} CommentNode
 *
 * @param {Object[]} topLevelComments List of comment entities.
 * @return {{ commentTree: CommentNode[]}} Tree of comment IDs.
 */
export const useCommentTree = ( topLevelComments ) => {
	const commentTree = useMemo(
		() =>
			topLevelComments?.map( ( { id, _embedded } ) => {
				const [ children ] = _embedded?.children || [ [] ];
				return {
					commentId: id,
					children: children.map( ( child ) => ( {
						commentId: child.id,
					} ) ),
				};
			} ),
		[ topLevelComments ]
	);

	return { commentTree };
};
