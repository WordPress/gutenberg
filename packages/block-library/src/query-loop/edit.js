/**
 * External dependencies
 */
import classnames from 'classnames';

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
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
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
			sticky,
			inherit,
		} = {},
		queryContext,
		layout: { type: layoutType = 'flex', columns = 1 } = {},
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
			// If sticky is not set, it will return all posts in the results.
			// If sticky is set to `only`, it will limit the results to sticky posts only.
			// If it is anything else, it will exclude sticky posts from results. For the record the value stored is `exclude`.
			if ( sticky ) {
				query.sticky = sticky === 'only';
			}

			// When you insert this block outside of the edit site then store
			// does not exist therefore we check for its existence.
			if ( inherit && select( 'core/edit-site' ) ) {
				// This should be passed from the context exposed by edit site.
				const { getTemplateId, getTemplateType } = select(
					'core/edit-site'
				);

				if ( 'wp_template' === getTemplateType() ) {
					const { slug } = select( 'core' ).getEntityRecord(
						'postType',
						'wp_template',
						getTemplateId()
					);

					// Change the post-type if needed.
					if ( slug?.startsWith( 'archive-' ) ) {
						query.postType = slug.replace( 'archive-', '' );
						postType = query.postType;
					}
				}
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
			sticky,
			inherit,
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
	const hasLayoutFlex = layoutType === 'flex' && columns > 1;
	const blockProps = useBlockProps( {
		className: classnames( {
			'is-flex-container': hasLayoutFlex,
			[ `columns-${ columns }` ]: hasLayoutFlex,
		} ),
	} );
	const innerBlocksProps = useInnerBlocksProps( {}, { template: TEMPLATE } );

	if ( ! posts ) {
		return <p { ...blockProps }>{ __( 'Loading…' ) }</p>;
	}

	if ( ! posts.length ) {
		return <p { ...blockProps }> { __( 'No results found.' ) }</p>;
	}

	return (
		<ul { ...blockProps }>
			{ blockContexts &&
				blockContexts.map( ( blockContext ) => (
					<BlockContextProvider
						key={ blockContext.postId }
						value={ blockContext }
					>
						{ blockContext ===
						( activeBlockContext || blockContexts[ 0 ] ) ? (
							<li { ...innerBlocksProps } />
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
		</ul>
	);
}
