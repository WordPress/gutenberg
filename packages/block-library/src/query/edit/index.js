/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useMemo, useState, useEffect } from '@wordpress/element';
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
	const { posts, isInnerBlockSelected, blocks } = useSelect(
		( select ) => {
			const { hasSelectedInnerBlock, getBlocks } = select(
				'core/block-editor'
			);
			return {
				posts: select( 'core' ).getEntityRecords(
					'postType',
					'post',
					query
				),
				isInnerBlockSelected: hasSelectedInnerBlock( clientId ),
				blocks: getBlocks( clientId ),
			};
		},
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
	useEffect( () => {
		if ( ! isInnerBlockSelected ) {
			setActiveBlockContext( null );
		}
	}, [ isInnerBlockSelected ] );

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
		</>
	);
}
