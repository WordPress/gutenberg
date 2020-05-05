/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import {
	BlockControls,
	BlockContextProvider,
	InnerBlocks,
	BlockPreview,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import QueryToolbar from './query-toolbar';

export default function QueryEdit( {
	clientId,
	attributes: { query },
	setAttributes,
} ) {
	const { posts, blocks } = useSelect(
		( select ) => ( {
			// TODO: Import UI for customizing query from sibling files.
			posts: select( 'core' ).getEntityRecords(
				'postType',
				'post',
				query
			),
			blocks: select( 'core/block-editor' ).getBlocks( clientId ),
		} ),
		[ query, clientId ]
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

	return (
		<>
			<BlockControls>
				<QueryToolbar
					query={ query }
					setQuery={ ( newQuery ) =>
						setAttributes( { query: { ...query, ...newQuery } } )
					}
				/>
			</BlockControls>
			{ blockContexts?.map( ( blockContext ) => {
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
			} ) }
		</>
	);
}
