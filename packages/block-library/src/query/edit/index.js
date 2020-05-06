/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo, useState, useEffect } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
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
import Pagination from './pagination';

export default function QueryEdit( {
	clientId,
	attributes: { query, id },
	setAttributes,
} ) {
	const [ page, setPage ] = useState( 1 );
	const [ activeBlockContext, setActiveBlockContext ] = useState();

	const { isInnerBlockSelected, posts, blocks } = useSelect(
		( select ) => {
			const { hasSelectedInnerBlock, getBlocks } = select(
				'core/block-editor'
			);
			return {
				isInnerBlockSelected: hasSelectedInnerBlock( clientId ),
				posts: select( 'core' ).getEntityRecords( 'postType', 'post', {
					...query,
					offset: query.per_page * ( page - 1 ) + query.offset,
					page,
				} ),
				blocks: getBlocks( clientId ),
			};
		},
		[ query, page, clientId ]
	);

	const instanceId = useInstanceId( QueryEdit );
	// We need this for multi-query block pagination.
	// Query parameters for each block are scoped to their ID.
	useEffect( () => {
		if ( ! id ) {
			setAttributes( { id: instanceId } );
		}
	}, [ id, instanceId ] );
	useEffect( () => {
		if ( ! isInnerBlockSelected ) {
			setActiveBlockContext( null );
		}
	}, [ isInnerBlockSelected ] );

	const blockContexts = useMemo(
		() =>
			posts?.map( ( post ) => ( {
				postType: post.type,
				postId: post.id,
			} ) ),
		[ posts ]
	);
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
						{ blockContext === activeBlockContext ? (
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
			{ query.pages !== 1 && (
				<Pagination
					pages={ query.pages }
					page={ page }
					setPage={ setPage }
				/>
			) }
		</>
	);
}
