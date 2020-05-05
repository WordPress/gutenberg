/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import {
	BlockContextProvider,
	InnerBlocks,
	BlockPreview,
} from '@wordpress/block-editor';

export default function QueryEdit( { clientId } ) {
	const { posts, blocks } = useSelect(
		( select ) => ( {
			// TODO: Import UI for customizing query from sibling files.
			posts: select( 'core' ).getEntityRecords( 'postType', 'post', {
				per_page: 10,
			} ),
			blocks: select( 'core/block-editor' ).getBlocks( clientId ),
		} ),
		[ clientId ]
	);
	const blockContexts = useMemo(
		() =>
			posts?.map( ( post ) => ( {
				postType: post.type,
				postId: post.id,
			} ) ),
		[ posts ]
	);
	const [ activeBlockContext, setActiveBlockContext ] = useState();

	if ( ! blockContexts ) {
		return null;
	}
	return blockContexts.map( ( blockContext ) => {
		return (
			<BlockContextProvider
				key={ blockContext.postId }
				value={ blockContext }
			>
				{ blockContext ===
				( activeBlockContext || blockContexts[ 0 ] ) ? (
					<InnerBlocks />
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
		);
	} );
}
