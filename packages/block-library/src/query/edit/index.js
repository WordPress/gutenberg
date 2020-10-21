/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
import {
	BlockControls,
	InnerBlocks,
	useBlockProps,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import QueryToolbar from './query-toolbar';
import QueryProvider from './query-provider';
import QueryInspectorControls from './query-inspector-controls';
import { DEFAULTS_POSTS_PER_PAGE } from '../constants';

const TEMPLATE = [ [ 'core/query-loop' ] ];

export default function QueryEdit( {
	attributes: { queryId, query },
	context: { postId },
	setAttributes,
	clientId,
} ) {
	const instanceId = useInstanceId( QueryEdit );
	const blockProps = useBlockProps();
	const { postsPerPage } = useSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		return {
			postsPerPage:
				+getSettings().postsPerPage || DEFAULTS_POSTS_PER_PAGE,
		};
	}, [] );
	// Changes in query property (which is an object) need to be in the same callback,
	// because updates are batched after the render and changes in different query properties
	// would cause to overide previous wanted changes.
	useEffect( () => {
		const newQuery = {};
		if ( postId && ! query.exclude?.length ) {
			newQuery.exclude = [ postId ];
		}
		if ( ! query.perPage && postsPerPage ) {
			newQuery.perPage = postsPerPage;
		}
		if ( Object.keys( newQuery ).length ) {
			updateQuery( newQuery );
		}
	}, [ query.perPage, query.exclude, postId ] );

	// const updateInnerBlocksTemplate = ( value ) => {
	// 	const newTpl = value.split( ',' ).reduce( ( res, x ) => {
	// 		res.push( [ x ] );
	// 		return res;
	// 	}, [] );
	// 	const newLoopTemplate = [
	// 		[
	// 			'core/query-loop',
	// 			{
	// 				// innerBlocksTemplate: newTpl,
	// 			},
	// 			newTpl,
	// 		],
	// 	];
	// 	replaceInnerBlocks(
	// 		clientId,
	// 		createBlocksFromInnerBlocksTemplate( newLoopTemplate ),
	// 		false
	// 	);
	// };

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
			<QueryInspectorControls
				query={ query }
				setQuery={ updateQuery }
				// updateInnerBlocksTemplate={ updateInnerBlocksTemplate }
				clientId={ clientId }
			/>
			<BlockControls>
				<QueryToolbar query={ query } setQuery={ updateQuery } />
			</BlockControls>
			<div { ...blockProps }>
				<QueryProvider>
					<InnerBlocks
						template={ TEMPLATE }
						templateInsertUpdatesSelection={ false }
					/>
				</QueryProvider>
			</div>
		</>
	);
}

export * from './query-provider';
