import type { HierarchicalRow } from './get-hierarchical-rows';

export interface TreeRow< Item > extends HierarchicalRow< Item > {
	canExpand: boolean;
	isExpanded: boolean;
}

/**
 * Marks which rows can expand and which are expanded, drops the rows that sit
 * under a collapsed parent, and returns the handlers that change expansion.
 *
 * @param rows                    Rows in hierarchical order.
 * @param getItemHasChildren      Returns whether an item has children, or `undefined` when unknown.
 * @param expandedItemIds         Ids of expanded items.
 * @param onChangeExpandedItemIds Called with the next expanded ids.
 */
export default function getTreeRows< Item >(
	rows: HierarchicalRow< Item >[],
	getItemHasChildren: ( item: Item ) => boolean | undefined,
	expandedItemIds: string[],
	onChangeExpandedItemIds: ( itemIds: string[] ) => void
) {
	const expandedItemIdSet = new Set( expandedItemIds );
	const allRows: TreeRow< Item >[] = rows.map( ( row, index ) => ( {
		...row,
		canExpand:
			rows[ index + 1 ]?.level > row.level ||
			getItemHasChildren( row.item ) !== false,
		isExpanded: expandedItemIdSet.has( row.id ),
	} ) );
	let collapsedLevel: number | undefined;
	const visibleRows = allRows.filter( ( row ) => {
		if ( collapsedLevel !== undefined ) {
			if ( row.level > collapsedLevel ) {
				return false;
			}
			collapsedLevel = undefined;
		}
		if ( row.canExpand && ! row.isExpanded ) {
			collapsedLevel = row.level;
		}
		return true;
	} );

	const expandableItemIds = allRows
		.filter( ( row ) => row.canExpand )
		.map( ( row ) => row.id );
	const expandableItemIdSet = new Set( expandableItemIds );
	const isAllExpanded =
		expandableItemIds.length > 0 &&
		expandableItemIds.every( ( id ) => expandedItemIdSet.has( id ) );

	return {
		visibleRows,
		expandableItemIds,
		isAllExpanded,
		onToggleExpanded: ( id: string ) =>
			onChangeExpandedItemIds(
				expandedItemIdSet.has( id )
					? expandedItemIds.filter( ( itemId ) => itemId !== id )
					: [ ...expandedItemIds, id ]
			),
		onToggleAllExpanded: () =>
			onChangeExpandedItemIds(
				isAllExpanded
					? expandedItemIds.filter(
							( id ) => ! expandableItemIdSet.has( id )
						)
					: [
							...new Set( [
								...expandedItemIds,
								...expandableItemIds,
							] ),
						]
			),
	};
}
