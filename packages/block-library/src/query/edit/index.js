/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
import { BlockControls, InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import QueryToolbar from './query-toolbar';
import QueryProvider from './query-provider';

const TEMPLATE = [ [ 'core/query-loop' ], [ 'core/query-pagination' ] ];
export default function QueryEdit( {
	attributes: { queryId, query },
	setAttributes,
} ) {
	const instanceId = useInstanceId( QueryEdit );
	// We need this for multi-query block pagination.
	// Query parameters for each block are scoped to their ID.
	useEffect( () => {
		if ( ! queryId ) {
			setAttributes( { queryId: instanceId } );
		}
	}, [ queryId, instanceId ] );
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
			<QueryProvider>
				<InnerBlocks template={ TEMPLATE } />
			</QueryProvider>
		</>
	);
}

export * from './query-provider';
