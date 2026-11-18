import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useEntityRecords } from '@wordpress/core-data';

// This is limited by WP REST API
const MAX_COMMENTS_PER_PAGE = 100;

/**
 * Return an object with the query args needed to fetch the default page of
 * comments.
 *
 * @param {Object} props        Hook props.
 * @param {number} props.postId ID of the post that contains the comments.
 *                              discussion settings.
 *
 * @return {Object} Query args to retrieve the comments.
 */
export const useCommentQueryArgs = ( { postId } ) => {
	// Initialize the query args that are not going to change.
	const queryArgs = {
		status: 'approve',
		order: 'asc',
		context: 'embed',
		parent: 0,
		_embed: 'children',
	};

	// Get the Discussion settings that may be needed to query the comments.
	const {
		pageComments,
		commentsPerPage,
		defaultCommentsPage: defaultPage,
	} = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const { __experimentalDiscussionSettings } = getSettings();
		return __experimentalDiscussionSettings ?? {};
	}, [] );

	// WP REST API doesn't allow fetching more than max items limit set per single page of data.
	// As for the editor performance is more important than completeness of data and fetching only the
	// max allowed for single page should be enough for the purpose of design and laying out the page.
	// Fetching over the limit would return an error here but would work with backend query.
	const perPage = pageComments
		? Math.min( commentsPerPage, MAX_COMMENTS_PER_PAGE )
		: MAX_COMMENTS_PER_PAGE;

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
 * index is by using the `X-WP-Total` header, which forces to make an
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
	const isNewest = defaultPage === 'newest';
	// We need to fetch comments to know the index. Fetch a single ID, to make
	// this call as light as possible.
	const { totalItems, hasResolved } = useEntityRecords(
		'root',
		'comment',
		{ ...queryArgs, post: postId, per_page: 1, _fields: 'id' },
		{ enabled: isNewest }
	);

	// The oldest one is always the first one.
	if ( ! isNewest ) {
		return 1;
	}
	// Keep the last known total while it's fetched again.
	if ( totalItems === null && ! hasResolved ) {
		return 0;
	}
	// With no comments, or when the request fails, there is no page count,
	// but there is a first page.
	return Math.max( Math.ceil( ( totalItems ?? 0 ) / perPage ), 1 );
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

	return commentTree;
};
