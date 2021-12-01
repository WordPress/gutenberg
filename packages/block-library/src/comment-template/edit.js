/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	BlockContextProvider,
	BlockPreview,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { convertToTree } from './util';

const TEMPLATE = [
	[ 'core/comment-author-avatar' ],
	[ 'core/comment-author-name' ],
	[ 'core/comment-date' ],
	[ 'core/comment-content' ],
	[ 'core/comment-reply-link' ],
	[ 'core/comment-edit-link' ],
];

/**
 * Component which renders the inner blocks of the Comment Template.
 *
 * @param {Object} props                         Component props.
 * @param {Array}  [props.blockContext]          - A comment object.
 * @param {Array}  [props.activeBlockContext]    - The block that is currently active.
 * @param {Array}  [props.setActiveBlockContext] - The setter for activeBlockContext.
 * @param {Array}  [props.firstBlock]            - First comment in the array.
 * @param {Array}  [props.blocks]                - Array of blocks returned from
 *                                               getBlocks() in parent .
 * @return {WPElement}                 		Inner blocks of the Comment Template
 */
function CommentTemplateInnerBlocks( {
	blockContext,
	activeBlockContext,
	setActiveBlockContext,
	firstBlock,
	blocks,
} ) {
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		{},
		{ template: TEMPLATE }
	);
	return (
		<li { ...innerBlocksProps }>
			{ blockContext === ( activeBlockContext || firstBlock ) ? (
				children
			) : (
				<BlockPreview
					blocks={ blocks }
					__experimentalLive
					__experimentalOnClick={ () =>
						setActiveBlockContext( blockContext )
					}
				/>
			) }
			{ blockContext?.children?.length > 0 ? (
				<CommentsList
					blockContexts={ blockContext.children }
					activeBlockContext={ activeBlockContext }
					setActiveBlockContext={ setActiveBlockContext }
					blocks={ blocks }
				/>
			) : null }
		</li>
	);
}

/**
 * Component that renders a list of (nested) comments. It is called recursively.
 *
 * @param {Object} props                         Component props.
 * @param {Array}  [props.blockProps]            - Props from parent's `useBlockProps()`.
 * @param {Array}  [props.blockContexts]         - Array of comment objects.
 * @param {Array}  [props.activeBlockContext]    - The block that is currently active.
 * @param {Array}  [props.setActiveBlockContext] - The setter for activeBlockContext.
 * @param {Array}  [props.blocks]                - Array of blocks returned from
 *                                               getBlocks() in parent .
 * @return {WPElement}                 		List of comments.
 */
const CommentsList = ( {
	blockProps,
	blockContexts,
	activeBlockContext,
	setActiveBlockContext,
	blocks,
} ) => (
	<ol { ...blockProps }>
		{ blockContexts &&
			blockContexts.map( ( blockContext ) => (
				<BlockContextProvider
					key={ blockContext.commentId }
					value={ blockContext }
				>
					<CommentTemplateInnerBlocks
						blockContext={ blockContext }
						activeBlockContext={ activeBlockContext }
						setActiveBlockContext={ setActiveBlockContext }
						blocks={ blocks }
						firstBlock={ blockContexts[ 0 ] }
					/>
				</BlockContextProvider>
			) ) }
	</ol>
);

export default function CommentTemplateEdit( {
	clientId,
	context: { postId, queryPerPage },
} ) {
	const blockProps = useBlockProps();

	const [ activeBlockContext, setActiveBlockContext ] = useState();

	const { comments, blocks } = useSelect(
		( select ) => {
			const { getEntityRecords } = select( coreStore );
			const { getBlocks } = select( blockEditorStore );

			return {
				comments: getEntityRecords( 'root', 'comment', {
					post: postId,
					status: 'approve',
					per_page: queryPerPage,
					order: 'asc',
				} ),
				blocks: getBlocks( clientId ),
			};
		},
		[ queryPerPage, postId, clientId ]
	);

	const blockContexts = useMemo( () => convertToTree( comments ), [
		comments,
	] );

	if ( ! comments ) {
		return (
			<p { ...blockProps }>
				<Spinner />
			</p>
		);
	}

	if ( ! comments.length ) {
		return <p { ...blockProps }> { __( 'No results found.' ) }</p>;
	}

	return (
		<CommentsList
			blockContexts={ blockContexts }
			blockProps={ blockProps }
			blocks={ blocks }
			activeBlockContext={ activeBlockContext }
			setActiveBlockContext={ setActiveBlockContext }
		/>
	);
}
