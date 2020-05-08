/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	BlockContextProvider,
	InnerBlocks,
	BlockPreview,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useQueryContext } from '../query';

const TEMPLATE = [ [ 'core/post-title' ], [ 'core/post-content' ] ];
export default function QueryLoopEdit( { clientId, context: { query } } ) {
	const [ { page } ] = useQueryContext();
	const [ activeBlockContext, setActiveBlockContext ] = useState();

	const { posts, blocks } = useSelect(
		( select ) => ( {
			posts: select( 'core' ).getEntityRecords( 'postType', 'post', {
				...query,
				offset: query.per_page * ( page - 1 ) + query.offset,
				page,
			} ),
			blocks: select( 'core/block-editor' ).getBlocks( clientId ),
		} ),
		[ query, page, clientId ]
	);

	const blockContexts = useMemo(
		() =>
			posts?.map( ( post ) => ( {
				postType: post.type,
				postId: post.id,
			} ) ),
		[ posts ]
	);
	return blockContexts
		? blockContexts.map( ( blockContext ) => (
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
		  ) )
		: null;
}
