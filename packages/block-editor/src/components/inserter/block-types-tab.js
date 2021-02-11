/**
 * External dependencies
 */
import { map, flow, groupBy, orderBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { useMemo, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';
import InserterPanel from './panel';
import useBlockTypesState from './hooks/use-block-types-state';

const getBlockNamespace = ( item ) => item.name.split( '/' )[ 0 ];

const MAX_SUGGESTED_ITEMS = 6;

export function BlockTypesTab( {
	rootClientId,
	onInsert,
	onHover,
	showMostUsedBlocks,
} ) {
	const [ items, categories, collections, onSelectItem ] = useBlockTypesState(
		rootClientId,
		onInsert
	);

	const suggestedItems = useMemo( () => {
		return orderBy( items, [ 'frecency' ], [ 'desc' ] ).slice(
			0,
			MAX_SUGGESTED_ITEMS
		);
	}, [ items ] );

	const uncategorizedItems = useMemo( () => {
		return items.filter( ( item ) => ! item.category );
	}, [ items ] );

	const itemsPerCategory = useMemo( () => {
		// Prioritize core blocks's display in inserter.
		const sortCoreBlocks = ( a, b ) => {
			const coreBlockNamePrefix = 'core/';
			const firstIsCoreBlock = a.name.startsWith( coreBlockNamePrefix );
			const secondIsCoreBlock = b.name.startsWith( coreBlockNamePrefix );
			if ( firstIsCoreBlock && secondIsCoreBlock ) {
				return 0;
			}
			return firstIsCoreBlock && ! secondIsCoreBlock ? -1 : 1;
		};

		return flow(
			( itemList ) =>
				itemList.filter(
					( item ) => item.category && item.category !== 'reusable'
				),
			( itemList ) => itemList.sort( sortCoreBlocks ),
			( itemList ) => groupBy( itemList, 'category' )
		)( items );
	}, [ items, categories ] );

	const itemsPerCollection = useMemo( () => {
		// Create a new Object to avoid mutating collection.
		const result = { ...collections };
		Object.keys( collections ).forEach( ( namespace ) => {
			result[ namespace ] = items.filter(
				( item ) => getBlockNamespace( item ) === namespace
			);
			if ( result[ namespace ].length === 0 ) {
				delete result[ namespace ];
			}
		} );

		return result;
	}, [ items, collections ] );

	// Hide block preview on unmount.
	useEffect( () => () => onHover( null ), [] );

	return (
		<div>
			{ showMostUsedBlocks && !! suggestedItems.length && (
				<InserterPanel title={ _x( 'Most used', 'blocks' ) }>
					<BlockTypesList
						items={ suggestedItems }
						onSelect={ onSelectItem }
						onHover={ onHover }
						label={ _x( 'Most used', 'blocks' ) }
					/>
				</InserterPanel>
			) }

			{ map( categories, ( category ) => {
				const categoryItems = itemsPerCategory[ category.slug ];
				if ( ! categoryItems || ! categoryItems.length ) {
					return null;
				}
				return (
					<InserterPanel
						key={ category.slug }
						title={ category.title }
						icon={ category.icon }
					>
						<BlockTypesList
							items={ categoryItems }
							onSelect={ onSelectItem }
							onHover={ onHover }
							label={ category.title }
						/>
					</InserterPanel>
				);
			} ) }

			{ ! uncategorizedItems.length && (
				<InserterPanel
					className="block-editor-inserter__uncategorized-blocks-panel"
					title={ __( 'Uncategorized' ) }
				>
					<BlockTypesList
						items={ uncategorizedItems }
						onSelect={ onSelectItem }
						onHover={ onHover }
						label={ __( 'Uncategorized' ) }
					/>
				</InserterPanel>
			) }

			{ map( collections, ( collection, namespace ) => {
				const collectionItems = itemsPerCollection[ namespace ];
				if ( ! collectionItems || ! collectionItems.length ) {
					return null;
				}

				return (
					<InserterPanel
						key={ namespace }
						title={ collection.title }
						icon={ collection.icon }
					>
						<BlockTypesList
							items={ collectionItems }
							onSelect={ onSelectItem }
							onHover={ onHover }
							label={ collection.title }
						/>
					</InserterPanel>
				);
			} ) }
		</div>
	);
}

export default BlockTypesTab;
