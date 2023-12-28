/**
 * WordPress dependencies
 */
import { useState, memo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	BlockContextProvider,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
	__experimentalUseBlockPreview as useBlockPreview,
} from '@wordpress/block-editor';
import { Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useCommentQueryArgs, useCommentTree } from './hooks';

const TEMPLATE = [
	[ 'core/avatar' ],
	[ 'core/comment-author-name' ],
	[ 'core/comment-date' ],
	[ 'core/comment-content' ],
	[ 'core/comment-reply-link' ],
	[ 'core/comment-edit-link' ],
];

/**
 * Function that returns a comment structure that will be rendered with default placehoders.
 *
 * Each comment has a `commentId` property that is always a negative number in
 * case of the placeholders. This is to ensure that the comment does not
 * conflict with the actual (real) comments.
 *
 * @param {Object}  settings                       Discussion Settings.
 * @param {number}  [settings.perPage]             - Comments per page setting or block attribute.
 * @param {boolean} [settings.pageComments]        - Enable break comments into pages setting.
 * @param {boolean} [settings.threadComments]      - Enable threaded (nested) comments setting.
 * @param {number}  [settings.threadCommentsDepth] - Level deep of threaded comments.
 *
 * @typedef {{id: null, children: EmptyComment[]}} EmptyComment
 * @return {EmptyComment[]}                 		Inner blocks of the Comment Template
 */
const getCommentsPlaceholder = ( {
	perPage,
	pageComments,
	threadComments,
	threadCommentsDepth,
} ) => {
	// Limit commentsDepth to 3
	const commentsDepth = ! threadComments
		? 1
		: Math.min( threadCommentsDepth, 3 );

	const buildChildrenComment = ( commentsLevel ) => {
		// Render children comments until commentsDepth is reached
		if ( commentsLevel < commentsDepth ) {
			const nextLevel = commentsLevel + 1;

			return [
				{
					commentId: -( commentsLevel + 3 ),
					children: buildChildrenComment( nextLevel ),
				},
			];
		}
		return [];
	};

	// Add the first comment and its children
	const placeholderComments = [
		{ commentId: -1, children: buildChildrenComment( 1 ) },
	];

	// Add a second comment unless the break comments setting is active and set to less than 2, and there is one nested comment max
	if ( ( ! pageComments || perPage >= 2 ) && commentsDepth < 3 ) {
		placeholderComments.push( {
			commentId: -2,
			children: [],
		} );
	}

	// Add a third comment unless the break comments setting is active and set to less than 3, and there aren't nested comments
	if ( ( ! pageComments || perPage >= 3 ) && commentsDepth < 2 ) {
		placeholderComments.push( {
			commentId: -3,
			children: [],
		} );
	}

	// In case that the value is set but larger than 3 we truncate it to 3.
	return placeholderComments;
};

/**
 * Component which renders the inner blocks of the Comment Template.
 *
 * @param {Object} props                      Component props.
 * @param {Array}  [props.comment]            - A comment object.
 * @param {Array}  [props.activeCommentId]    - The ID of the comment that is currently active.
 * @param {Array}  [props.setActiveCommentId] - The setter for activeCommentId.
 * @param {Array}  [props.firstCommentId]     - ID of the first comment in the array.
 * @param {Array}  [props.blocks]             - Array of blocks returned from
 *                                            getBlocks() in parent .
 * @return {Element}                 		Inner blocks of the Comment Template
 */
function CommentTemplateInnerBlocks( {
	comment,
	activeCommentId,
	setActiveCommentId,
	firstCommentId,
	blocks,
} ) {
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		{},
		{ template: TEMPLATE }
	);

	return (
		<li { ...innerBlocksProps }>
			{ comment.commentId === ( activeCommentId || firstCommentId )
				? children
				: null }

			{ /* To avoid flicker when switching active block contexts, a preview
			 is ALWAYS rendered and the preview for the active block is hidden.
			 This ensures that when switching the active block, the component is not
			 mounted again but rather it only toggles the `isHidden` prop.
			 The same strategy is used for preventing the flicker in the Post Template
			 block. */ }
			<MemoizedCommentTemplatePreview
				blocks={ blocks }
				commentId={ comment.commentId }
				setActiveCommentId={ setActiveCommentId }
				isHidden={
					comment.commentId === ( activeCommentId || firstCommentId )
				}
			/>

			{ comment?.children?.length > 0 ? (
				<CommentsList
					comments={ comment.children }
					activeCommentId={ activeCommentId }
					setActiveCommentId={ setActiveCommentId }
					blocks={ blocks }
					firstCommentId={ firstCommentId }
				/>
			) : null }
		</li>
	);
}

const CommentTemplatePreview = ( {
	blocks,
	commentId,
	setActiveCommentId,
	isHidden,
} ) => {
	const blockPreviewProps = useBlockPreview( {
		blocks,
	} );

	const handleOnClick = () => {
		setActiveCommentId( commentId );
	};

	// We have to hide the preview block if the `comment` props points to
	// the curently active block!

	// Or, to put it differently, every preview block is visible unless it is the
	// currently active block - in this case we render its inner blocks.
	const style = {
		display: isHidden ? 'none' : undefined,
	};

	return (
		<div
			{ ...blockPreviewProps }
			tabIndex={ 0 }
			role="button"
			style={ style }
			// eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
			onClick={ handleOnClick }
			onKeyPress={ handleOnClick }
		/>
	);
};

const MemoizedCommentTemplatePreview = memo( CommentTemplatePreview );

/**
 * Component that renders a list of (nested) comments. It is called recursively.
 *
 * @param {Object} props                      Component props.
 * @param {Array}  [props.comments]           - Array of comment objects.
 * @param {Array}  [props.blockProps]         - Props from parent's `useBlockProps()`.
 * @param {Array}  [props.activeCommentId]    - The ID of the comment that is currently active.
 * @param {Array}  [props.setActiveCommentId] - The setter for activeCommentId.
 * @param {Array}  [props.blocks]             - Array of blocks returned from getBlocks() in parent.
 * @param {Object} [props.firstCommentId]     - The ID of the first comment in the array of
 *                                            comment objects.
 * @return {Element}                 		List of comments.
 */
const CommentsList = ( {
	comments,
	blockProps,
	activeCommentId,
	setActiveCommentId,
	blocks,
	firstCommentId,
} ) => (
	<ol { ...blockProps }>
		{ comments &&
			comments.map( ( { commentId, ...comment }, index ) => (
				<BlockContextProvider
					key={ comment.commentId || index }
					value={ {
						// If the commentId is negative it means that this comment is a
						// "placeholder" and that the block is most likely being used in the
						// site editor. In this case, we have to set the commentId to `null`
						// because otherwise the (non-existent) comment with a negative ID
						// would be reqested from the REST API.
						commentId: commentId < 0 ? null : commentId,
					} }
				>
					<CommentTemplateInnerBlocks
						comment={ { commentId, ...comment } }
						activeCommentId={ activeCommentId }
						setActiveCommentId={ setActiveCommentId }
						blocks={ blocks }
						firstCommentId={ firstCommentId }
					/>
				</BlockContextProvider>
			) ) }
	</ol>
);

export default function CommentTemplateEdit( {
	clientId,
	context: { postId },
} ) {
	const blockProps = useBlockProps();

	const [ activeCommentId, setActiveCommentId ] = useState();
	const {
		commentOrder,
		threadCommentsDepth,
		threadComments,
		commentsPerPage,
		pageComments,
	} = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().__experimentalDiscussionSettings;
	} );

	const commentQuery = useCommentQueryArgs( {
		postId,
	} );

	const { topLevelComments, blocks } = useSelect(
		( select ) => {
			const { getEntityRecords } = select( coreStore );
			const { getBlocks } = select( blockEditorStore );
			return {
				// Request only top-level comments. Replies are embedded.
				topLevelComments: commentQuery
					? getEntityRecords( 'root', 'comment', commentQuery )
					: null,
				blocks: getBlocks( clientId ),
			};
		},
		[ clientId, commentQuery ]
	);

	// Generate a tree structure of comment IDs.
	let commentTree = useCommentTree(
		// Reverse the order of top comments if needed.
		commentOrder === 'desc' && topLevelComments
			? [ ...topLevelComments ].reverse()
			: topLevelComments
	);

	if ( ! topLevelComments ) {
		return (
			<p { ...blockProps }>
				<Spinner />
			</p>
		);
	}

	if ( ! postId ) {
		commentTree = getCommentsPlaceholder( {
			perPage: commentsPerPage,
			pageComments,
			threadComments,
			threadCommentsDepth,
		} );
	}

	if ( ! commentTree.length ) {
		return <p { ...blockProps }>{ __( 'No results found.' ) }</p>;
	}

	return (
		<CommentsList
			comments={ commentTree }
			blockProps={ blockProps }
			blocks={ blocks }
			activeCommentId={ activeCommentId }
			setActiveCommentId={ setActiveCommentId }
			firstCommentId={ commentTree[ 0 ]?.commentId }
		/>
	);
}
