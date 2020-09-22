/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
import {
	BlockControls,
	InnerBlocks,
	__experimentalUseBlockWrapperProps as useBlockWrapperProps,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import QueryToolbar from './query-toolbar';
import QueryProvider from './query-provider';
import QueryInspectorControls from './query-inspector-controls';

const TEMPLATE = [ [ 'core/query-loop' ], [ 'core/query-pagination' ] ];
export default function QueryEdit( {
	attributes: { queryId, query },
	setAttributes,
} ) {
	const instanceId = useInstanceId( QueryEdit );
	const blockWrapperProps = useBlockWrapperProps();
	// We need this for multi-query block pagination.
	// Query parameters for each block are scoped to their ID.
	useEffect( () => {
		if ( ! queryId ) {
			setAttributes( { queryId: instanceId } );
		}
	}, [ queryId, instanceId ] );
	const updateQuery = ( newQuery ) =>
		setAttributes( { query: { ...query, ...newQuery } } );
	return (
		<>
			<QueryInspectorControls query={ query } setQuery={ updateQuery } />
			<BlockControls>
				<QueryToolbar query={ query } setQuery={ updateQuery } />
			</BlockControls>
			<div { ...blockWrapperProps }>
				<QueryProvider>
					<InnerBlocks template={ TEMPLATE } />
				</QueryProvider>
			</div>
		</>
	);
}

export * from './query-provider';
