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

function CommentTemplateInnerBlocks() {
	const innerBlocksProps = useInnerBlocksProps( {}, { template: TEMPLATE } );
	return <li { ...innerBlocksProps }></li>;
}

/**
 * Component that renders a list of (nested) comments. It is called recursively
 * in its own body.
 *
 * @param {Object} props                 Component props.
 * @param {Array}  [props.blockContexts] - Array of comment objects.
 * @return {WPElement}                 		List of comments.
 */
const RenderComments = ( { blockContexts, ...props } ) => (
	<ol { ...props.blockProps }>
		{ blockContexts &&
			blockContexts.map( ( blockContext ) => (
				<BlockContextProvider
					key={ blockContext.commentId }
					value={ blockContext }
				>
					{ blockContext ===
					( props.activeBlockContext || blockContexts[ 0 ] ) ? (
						<>
							<CommentTemplateInnerBlocks />
							{ blockContext.children.length > 0 ? (
								<RenderComments
									blockContexts={ blockContext.children }
									{ ...props }
								/>
							) : null }
						</>
					) : (
						<li>
							<BlockPreview
								blocks={ props.blocks }
								__experimentalLive
								__experimentalOnClick={ () =>
									props.setActiveBlockContext(
										props.blockContext
									)
								}
							/>
							{ blockContext.children.length > 0 ? (
								<RenderComments
									blockContexts={ blockContext.children }
									{ ...props }
								/>
							) : null }
						</li>
					) }
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

	const blockContexts = useMemo(
		() =>
			convertToTree(
				comments?.map( ( { id, parent } ) => ( {
					commentId: id,
					parent,
				} ) )
			),
		[ comments ]
	);

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
		<RenderComments
			blockContexts={ blockContexts }
			blockProps={ blockProps }
			blocks={ blocks }
			activeBlockContext={ activeBlockContext }
			setActiveBlockContext={ setActiveBlockContext }
		/>
	);
}
