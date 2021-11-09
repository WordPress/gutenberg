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
	return <li { ...innerBlocksProps } />;
}

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
					per_page:
						// `commentsPerPage` are added to the REST API.
						//
						// If the `queryPerPage` is set, use that. Otherwise, just use `50`
						// (it's the default value of comments_per_page)
						queryPerPage || 50,
					order: 'asc',
				} ),
				blocks: getBlocks( clientId ),
			};
		},
		[ queryPerPage, postId, clientId ]
	);

	const blockContexts = useMemo(
		() => comments?.map( ( comment ) => ( { commentId: comment.id } ) ),
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
		<ol { ...blockProps }>
			{ blockContexts &&
				blockContexts.map( ( blockContext ) => (
					<BlockContextProvider
						key={ blockContext.commentId }
						value={ blockContext }
					>
						{ blockContext ===
						( activeBlockContext || blockContexts[ 0 ] ) ? (
							<CommentTemplateInnerBlocks />
						) : (
							<li>
								<BlockPreview
									blocks={ blocks }
									__experimentalLive
									__experimentalOnClick={ () =>
										setActiveBlockContext( blockContext )
									}
								/>
							</li>
						) }
					</BlockContextProvider>
				) ) }
		</ol>
	);
}
