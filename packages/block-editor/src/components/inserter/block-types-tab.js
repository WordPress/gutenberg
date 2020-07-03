/**
 * External dependencies
 */
import { map, findIndex, flow, sortBy, groupBy, isEmpty } from 'lodash';

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
		return items.slice( 0, MAX_SUGGESTED_ITEMS );
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
		// Create a new Object to avoid mutating collection
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

	// Announce search results on change
	useEffect( () => {
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', filteredItems.length ),
			filteredItems.length
		);
		debouncedSpeak( resultsFoundMessage );
	}, [ filterValue, debouncedSpeak ] );

	const hasItems = ! isEmpty( filteredItems );

	return (
		<div>
			{ hasChildItems && (
				<ChildBlocks rootClientId={ rootClientId }>
					<BlockTypesList
						// Pass along every block, as useBlockTypesState() and
						// getInserterItems() will have already filtered out
						// non-child blocks.
						items={ filteredItems }
						onSelect={ onSelectItem }
						onHover={ onHover }
					/>
				</ChildBlocks>
			) }

			{ showMostUsedBlocks &&
				! hasChildItems &&
				!! suggestedItems.length &&
				! filterValue && (
					<InserterPanel title={ _x( 'Most used', 'blocks' ) }>
						<BlockTypesList
							items={ suggestedItems }
							onSelect={ onSelectItem }
							onHover={ onHover }
						/>
					</InserterPanel>
				) }

			{ ! hasChildItems &&
				map( categories, ( category ) => {
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
							/>
						</InserterPanel>
					);
				} ) }

			{ ! hasChildItems && !! uncategorizedItems.length && (
				<InserterPanel
					className="block-editor-inserter__uncategorized-blocks-panel"
					title={ __( 'Uncategorized' ) }
				>
					<BlockTypesList
						items={ uncategorizedItems }
						onSelect={ onSelectItem }
						onHover={ onHover }
					/>
				</InserterPanel>
			) }

			{ ! hasChildItems &&
				map( collections, ( collection, namespace ) => {
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
							/>
						</InserterPanel>
					);
				} ) }

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
