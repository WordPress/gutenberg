/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	BlockContextProvider,
	InnerBlocks,
	BlockPreview,
	useBlockProps,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useQueryContext } from '../query';

const TEMPLATE = [
	[ 'core/post-title' ],
	[ 'core/post-date' ],
	[ 'core/post-excerpt' ],
];
export default function QueryLoopEdit( {
	clientId,
	context: {
		query: {
			perPage,
			offset,
			categoryIds,
			postType,
			tagIds = [],
			order,
			orderBy,
			author,
			search,
			exclude,
		} = {},
		queryContext,
	},
} ) {
	const [ { page } ] = useQueryContext() || queryContext || [ {} ];
	const [ activeBlockContext, setActiveBlockContext ] = useState();

	const { posts, blocks } = useSelect(
		( select ) => {
			const { getEntityRecords } = select( 'core' );
			const { getBlocks } = select( 'core/block-editor' );
			const query = {
				offset: perPage ? perPage * ( page - 1 ) + offset : 0,
				categories: categoryIds,
				tags: tagIds,
				order,
				orderby: orderBy,
			};
			if ( perPage ) {
				query.per_page = perPage;
			}
			if ( author ) {
				query.author = author;
			}
			if ( search ) {
				query.search = search;
			}
			if ( exclude?.length ) {
				query.exclude = exclude;
			}
			return {
				posts: getEntityRecords( 'postType', postType, query ),
				blocks: getBlocks( clientId ),
			};
		},
		[
			perPage,
			page,
			offset,
			categoryIds,
			tagIds,
			order,
			orderBy,
			clientId,
			author,
			search,
			postType,
			exclude,
		]
	);

	const blockContexts = useMemo(
		() =>
			posts?.map( ( post ) => ( {
				postType: post.type,
				postId: post.id,
			} ) ),
		[ posts ]
	);
	const blockProps = useBlockProps();

	if ( ! posts ) {
		return <p { ...blockProps }>{ __( 'Loading…' ) }</p>;
	}

	if ( ! posts.length ) {
		return <p { ...blockProps }> { __( 'No results found.' ) }</p>;
	}

	return (
		<div { ...blockProps }>
			{ blockContexts &&
				blockContexts.map( ( blockContext ) => (
					<BlockContextProvider
						key={ blockContext.postId }
						value={ blockContext }
					>
						{ blockContext ===
						( activeBlockContext || blockContexts[ 0 ] ) ? (
							<InnerBlocks template={ TEMPLATE } />
						) : (
							<BlockPreview
								blocks={ blocks }
								__experimentalLive
								__experimentalOnClick={ () =>
									setActiveBlockContext( blockContext )
								}
							/>
						) }
					</BlockContextProvider>
				) ) }
		</div>
	);
}
