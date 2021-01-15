/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
import {
	BlockControls,
	useBlockProps,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import QueryToolbar from './query-toolbar';
import QueryProvider from './query-provider';
import QueryInspectorControls from './query-inspector-controls';
import QueryPlaceholder from './query-placeholder';
import { DEFAULTS_POSTS_PER_PAGE } from '../constants';

const TEMPLATE = [ [ 'core/query-loop' ] ];
export function QueryContent( {
	attributes,
	context: { postId },
	setAttributes,
} ) {
	const { queryId, query, layout } = attributes;
	const instanceId = useInstanceId( QueryContent );
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( {}, { template: TEMPLATE } );
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
		if ( !! Object.keys( newQuery ).length ) {
			updateQuery( newQuery );
		}
	}, [ query.perPage, query.exclude, query.inherit, postId ] );
	// We need this for multi-query block pagination.
	// Query parameters for each block are scoped to their ID.
	useEffect( () => {
		if ( ! queryId ) {
			setAttributes( { queryId: instanceId } );
		}
	}, [ queryId, instanceId ] );
	const updateQuery = ( newQuery ) =>
		setAttributes( { query: { ...query, ...newQuery } } );
	const updateLayout = ( newLayout ) =>
		setAttributes( { layout: { ...layout, ...newLayout } } );
	return (
		<>
			<QueryInspectorControls
				attributes={ attributes }
				setQuery={ updateQuery }
				setLayout={ updateLayout }
			/>
			<BlockControls>
				<QueryToolbar
					attributes={ attributes }
					setQuery={ updateQuery }
					setLayout={ updateLayout }
				/>
			</BlockControls>
			<div { ...blockProps }>
				<QueryProvider>
					<div { ...innerBlocksProps } />
				</QueryProvider>
			</div>
		</>
	);
}

const QueryEdit = ( props ) => {
	const { clientId } = props;
	const hasInnerBlocks = useSelect(
		( select ) =>
			!! select( 'core/block-editor' ).getBlocks( clientId ).length,
		[ clientId ]
	);
	const Component = hasInnerBlocks ? QueryContent : QueryPlaceholder;

	return <Component { ...props } />;
};

export default QueryEdit;
export * from './query-provider';
