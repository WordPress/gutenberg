/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ViewTable } from '../../../types';
import { getTreeRows, getVisibleTreeRows, type TreeRow } from './tree-rows';

export interface TableRenderRow< Item > {
	item: Item;
	id: string;
	level?: number;
	hierarchyLevel?: number;
	childCount?: number;
	isExpanded?: boolean;
}

interface UseTableHierarchyProps< Item > {
	data: Item[];
	getItemId: ( item: Item ) => string;
	/**
	 * @deprecated Use getItemParentId for hierarchy.
	 */
	getItemLevel?: ( item: Item ) => number;
	getItemParentId?: ( item: Item ) => string | number | null | undefined;
	selection: string[];
	view: ViewTable;
}

function getSelectedAncestorIds< Item >(
	treeRows: TreeRow< Item >[],
	selection: string[]
) {
	const ancestorItemIds = new Set< string >();
	const rowById = new Map(
		treeRows.map( ( treeRow ) => [ treeRow.id, treeRow ] )
	);

	for ( const selectedItemId of selection ) {
		let treeRow = rowById.get( selectedItemId );
		const visitedItemIds = new Set< string >();

		while ( treeRow?.parentId && ! visitedItemIds.has( treeRow.id ) ) {
			visitedItemIds.add( treeRow.id );
			const parentRow = rowById.get( treeRow.parentId );
			if ( ! parentRow ) {
				break;
			}

			ancestorItemIds.add( parentRow.id );
			treeRow = parentRow;
		}
	}

	return ancestorItemIds;
}

export function useTableHierarchy< Item >( {
	data,
	getItemId,
	getItemLevel,
	getItemParentId,
	selection,
	view,
}: UseTableHierarchyProps< Item > ) {
	const isTreeHierarchy = !! (
		view.showLevels &&
		typeof getItemParentId === 'function' &&
		view.layout?.hierarchyStyle === 'tree'
	);
	const isTextHierarchy = !! (
		view.showLevels &&
		( typeof getItemParentId === 'function' ||
			typeof getItemLevel === 'function' ) &&
		view.layout?.hierarchyStyle !== 'tree'
	);
	const treeRows = useMemo( () => {
		if ( ! ( isTreeHierarchy || isTextHierarchy ) || ! getItemParentId ) {
			return [];
		}
		return getTreeRows( data, getItemId, getItemParentId );
	}, [ data, getItemId, getItemParentId, isTextHierarchy, isTreeHierarchy ] );

	const [ expandedItemIds, setExpandedItemIds ] = useState< Set< string > >(
		new Set()
	);
	const manuallyCollapsedItemIdsRef = useRef< Set< string > >( new Set() );

	useEffect( () => {
		if ( ! isTreeHierarchy ) {
			return;
		}

		setExpandedItemIds( ( previousExpandedItemIds ) => {
			const nextExpandedItemIds = new Set( previousExpandedItemIds );
			let hasChanges = false;

			if ( view.layout?.expandChildren ) {
				for ( const treeRow of treeRows ) {
					if (
						treeRow.childCount &&
						! manuallyCollapsedItemIdsRef.current.has(
							treeRow.id
						) &&
						! nextExpandedItemIds.has( treeRow.id )
					) {
						nextExpandedItemIds.add( treeRow.id );
						hasChanges = true;
					}
				}
			}

			for ( const ancestorItemId of getSelectedAncestorIds(
				treeRows,
				selection
			) ) {
				if ( ! nextExpandedItemIds.has( ancestorItemId ) ) {
					nextExpandedItemIds.add( ancestorItemId );
					hasChanges = true;
				}
			}

			return hasChanges ? nextExpandedItemIds : previousExpandedItemIds;
		} );
	}, [ treeRows, isTreeHierarchy, selection, view.layout?.expandChildren ] );

	const showHierarchyBadge =
		isTreeHierarchy && view.layout?.showHierarchyBadge !== false;

	const onToggleExpanded = useCallback(
		( itemId: string ) => {
			setExpandedItemIds( ( previousExpandedItemIds ) => {
				const nextExpandedItemIds = new Set( previousExpandedItemIds );
				if ( nextExpandedItemIds.has( itemId ) ) {
					nextExpandedItemIds.delete( itemId );
					if ( view.layout?.expandChildren ) {
						manuallyCollapsedItemIdsRef.current.add( itemId );
					}
				} else {
					nextExpandedItemIds.add( itemId );
					manuallyCollapsedItemIdsRef.current.delete( itemId );
				}
				return nextExpandedItemIds;
			} );
		},
		[ view.layout?.expandChildren ]
	);

	const getTextLevel = useCallback(
		( item: Item ) => {
			if ( getItemParentId ) {
				return undefined;
			}

			const level = getItemLevel?.( item );
			return typeof level === 'number' && Number.isFinite( level )
				? Math.max( 0, level )
				: undefined;
		},
		[ getItemLevel, getItemParentId ]
	);

	const getRowsToRender = useCallback(
		( items: Item[] ): TableRenderRow< Item >[] => {
			if (
				! ( isTreeHierarchy || isTextHierarchy ) ||
				! getItemParentId
			) {
				return items.map( ( item, index ) => ( {
					item,
					id: getItemId( item ) || index.toString(),
					level: isTextHierarchy ? getTextLevel( item ) : undefined,
				} ) );
			}

			const rows = getTreeRows( items, getItemId, getItemParentId );

			if ( isTextHierarchy ) {
				return rows.map( ( treeRow ) => ( {
					...treeRow,
					level: treeRow.depth,
				} ) );
			}

			return getVisibleTreeRows( rows, expandedItemIds ).map(
				( treeRow ) => ( {
					...treeRow,
					level: undefined,
					hierarchyLevel: treeRow.depth,
					isExpanded: expandedItemIds.has( treeRow.id ),
				} )
			);
		},
		[
			expandedItemIds,
			getItemId,
			getItemParentId,
			getTextLevel,
			isTextHierarchy,
			isTreeHierarchy,
		]
	);

	return {
		getRowsToRender,
		isTreeHierarchy,
		onToggleExpanded,
		showHierarchyBadge,
	};
}
