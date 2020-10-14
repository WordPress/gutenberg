/**
 * External dependencies
 */
import {
	findIndex,
	flow,
	sortBy,
	groupBy,
	isEmpty,
	orderBy,
	chunk,
} from 'lodash';
import { List, AutoSizer } from 'react-virtualized';

/**
 * WordPress dependencies
 */
import { __, _x, _n, sprintf } from '@wordpress/i18n';
import { withSpokenMessages } from '@wordpress/components';
import { useMemo, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockTypesList from '../block-types-list';
import ChildBlocks from './child-blocks';
import __experimentalInserterMenuExtension from '../inserter-menu-extension';
import { searchBlockItems } from './search-items';
import InserterPanel from './panel';
import InserterNoResults from './no-results';
import useBlockTypesState from './hooks/use-block-types-state';

const getBlockNamespace = ( item ) => item.name.split( '/' )[ 0 ];

const MAX_SUGGESTED_ITEMS = 6;

export function BlockTypesTab( {
	rootClientId,
	onInsert,
	onHover,
	filterValue,
	debouncedSpeak,
	showMostUsedBlocks,
} ) {
	const [ items, categories, collections, onSelectItem ] = useBlockTypesState(
		rootClientId,
		onInsert
	);

	const hasChildItems = useSelect(
		( select ) => {
			const { getBlockName } = select( 'core/block-editor' );
			const { getChildBlockNames } = select( 'core/blocks' );
			const rootBlockName = getBlockName( rootClientId );

			return !! getChildBlockNames( rootBlockName ).length;
		},
		[ rootClientId ]
	);

	const filteredItems = useMemo( () => {
		return searchBlockItems( items, categories, collections, filterValue );
	}, [ filterValue, items, categories, collections ] );

	const suggestedItems = useMemo( () => {
		return orderBy( items, [ 'frecency' ], [ 'desc' ] ).slice(
			0,
			MAX_SUGGESTED_ITEMS
		);
	}, [ items ] );

	const uncategorizedItems = useMemo( () => {
		return filteredItems.filter( ( item ) => ! item.category );
	}, [ filteredItems ] );

	const itemsPerCategory = useMemo( () => {
		const getCategoryIndex = ( item ) => {
			return findIndex(
				categories,
				( category ) => category.slug === item.category
			);
		};

		return flow(
			( itemList ) =>
				itemList.filter(
					( item ) => item.category && item.category !== 'reusable'
				),
			( itemList ) => sortBy( itemList, getCategoryIndex ),
			( itemList ) => groupBy( itemList, 'category' )
		)( filteredItems );
	}, [ filteredItems, categories ] );

	const itemsPerCollection = useMemo( () => {
		// Create a new Object to avoid mutating collection.
		const result = { ...collections };
		Object.keys( collections ).forEach( ( namespace ) => {
			result[ namespace ] = filteredItems.filter(
				( item ) => getBlockNamespace( item ) === namespace
			);
			if ( result[ namespace ].length === 0 ) {
				delete result[ namespace ];
			}
		} );

		return result;
	}, [ filteredItems, collections ] );

	// Hide block preview on unmount.
	useEffect( () => () => onHover( null ), [] );

	// Announce search results on change.
	useEffect( () => {
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', filteredItems.length ),
			filteredItems.length
		);
		debouncedSpeak( resultsFoundMessage );
	}, [ filterValue, debouncedSpeak ] );

	const hasItems = ! isEmpty( filteredItems );

	const finalRows = useMemo( () => {
		const rows = [];

		if ( hasChildItems ) {
			rows.push( {
				height: 34,
				component: <ChildBlocks rootClientId={ rootClientId } />,
			} );

			const chunks = chunk( filteredItems, 3 );
			for ( const chunkItems of chunks ) {
				rows.push( {
					height: 108,
					component: (
						<BlockTypesList
							// Pass along every block, as useBlockTypesState() and
							// getInserterItems() will have already filtered out
							// non-child blocks.
							items={ chunkItems }
							onSelect={ onSelectItem }
							onHover={ onHover }
							label={ __( 'Child Blocks' ) }
						/>
					),
				} );
			}
		}

		if (
			showMostUsedBlocks &&
			! hasChildItems &&
			!! suggestedItems.length &&
			! filterValue
		) {
			rows.push( {
				height: 34,
				component: (
					<InserterPanel title={ _x( 'Most used', 'blocks' ) } />
				),
			} );

			const chunks = chunk( suggestedItems, 3 );
			for ( const chunkItems of chunks ) {
				rows.push( {
					height: 108,
					component: (
						<BlockTypesList
							items={ chunkItems }
							onSelect={ onSelectItem }
							onHover={ onHover }
							label={ _x( 'Most used', 'blocks' ) }
						/>
					),
				} );
			}
		}

		if ( ! hasChildItems ) {
			for ( const category of categories ) {
				const categoryItems = itemsPerCategory[ category.slug ];
				if ( ! categoryItems || ! categoryItems.length ) {
					continue;
				}

				rows.push( {
					height: 34,
					component: (
						<InserterPanel
							key={ category.slug }
							title={ category.title }
							icon={ category.icon }
						/>
					),
				} );

				const chunks = chunk( categoryItems, 3 );
				for ( const chunkItems of chunks ) {
					rows.push( {
						height: 108,
						component: (
							<BlockTypesList
								items={ chunkItems }
								onSelect={ onSelectItem }
								onHover={ onHover }
								label={ category.title }
							/>
						),
					} );
				}
			}
		}

		if ( ! hasChildItems && !! uncategorizedItems.length ) {
			rows.push( {
				height: 34,
				component: (
					<InserterPanel
						className="block-editor-inserter__uncategorized-blocks-panel"
						title={ __( 'Uncategorized' ) }
					/>
				),
			} );

			const chunks = chunk( uncategorizedItems, 3 );
			for ( const chunkItems of chunks ) {
				rows.push( {
					height: 108,
					component: (
						<BlockTypesList
							items={ chunkItems }
							onSelect={ onSelectItem }
							onHover={ onHover }
							label={ __( 'Uncategorized' ) }
						/>
					),
				} );
			}
		}

		if ( ! hasChildItems ) {
			for ( const namespace of Object.keys( collections ) ) {
				const collection = collections[ namespace ];
				const collectionItems = itemsPerCollection[ namespace ];
				if ( ! collectionItems || ! collectionItems.length ) {
					continue;
				}

				rows.push( {
					height: 34,
					component: (
						<InserterPanel
							key={ namespace }
							title={ collection.title }
							icon={ collection.icon }
						/>
					),
				} );

				const chunks = chunk( collectionItems, 3 );
				for ( const chunkItems of chunks ) {
					rows.push( {
						height: 108,
						component: (
							<BlockTypesList
								items={ chunkItems }
								onSelect={ onSelectItem }
								onHover={ onHover }
								label={ collection.title }
							/>
						),
					} );
				}
			}
		}

		return rows;
	}, [
		rootClientId,
		hasChildItems,
		filteredItems,
		showMostUsedBlocks,
		filterValue,
		categories,
		itemsPerCategory,
		collections,
		itemsPerCollection,
		suggestedItems,
	] );

	return (
		<div>
			<AutoSizer>
				{ ( { height, width } ) => (
					<List
						width={ width }
						height={ height }
						rowCount={ finalRows.length }
						overscanRowCount={ 2 }
						rowHeight={ ( { index } ) => {
							return finalRows[ index ].height;
						} }
						rowRenderer={ ( { index, style } ) => {
							return (
								<div style={ style }>
									{ finalRows[ index ].component }
								</div>
							);
						} }
					/>
				) }
			</AutoSizer>

			<__experimentalInserterMenuExtension.Slot
				fillProps={ {
					onSelect: onSelectItem,
					onHover,
					filterValue,
					hasItems,
				} }
			>
				{ ( fills ) => {
					if ( fills.length ) {
						return fills;
					}
					if ( ! hasItems ) {
						return <InserterNoResults />;
					}
					return null;
				} }
			</__experimentalInserterMenuExtension.Slot>
		</div>
	);
}

export default withSpokenMessages( BlockTypesTab );
