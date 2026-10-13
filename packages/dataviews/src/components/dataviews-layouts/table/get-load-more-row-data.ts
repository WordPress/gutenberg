import type {
	HierarchyPagination,
	HierarchyPaginationInfo,
} from '../../../types';
import type { TreeRow } from './get-tree-rows';

export interface LoadMoreRowData< Item > {
	parent: TreeRow< Item >;
	paginationInfo: HierarchyPaginationInfo;
}

export function hasLoadMoreRow(
	paginationInfo: HierarchyPaginationInfo | undefined
): paginationInfo is HierarchyPaginationInfo {
	return !! (
		paginationInfo &&
		( paginationInfo.hasMore ||
			paginationInfo.isLoading ||
			paginationInfo.error )
	);
}

/**
 * Places each expanded parent's Load more row after its last visible
 * descendant. Keys are the indexes of the rows the Load more rows follow.
 *
 * @param rows                Visible rows in hierarchical order.
 * @param hierarchyPagination Per-level pagination state.
 */
export default function getLoadMoreRowData< Item >(
	rows: TreeRow< Item >[],
	hierarchyPagination: HierarchyPagination
): Map< number, LoadMoreRowData< Item >[] > {
	const loadMoreRows = new Map< number, LoadMoreRowData< Item >[] >();
	const openLoadMoreRows: LoadMoreRowData< Item >[] = [];
	const closeLoadMoreRow = ( rowIndex: number ) => {
		const loadMoreRow = openLoadMoreRows.pop();
		if ( loadMoreRow ) {
			const current = loadMoreRows.get( rowIndex ) ?? [];
			current.push( loadMoreRow );
			loadMoreRows.set( rowIndex, current );
		}
	};

	rows.forEach( ( row, rowIndex ) => {
		while (
			openLoadMoreRows.length &&
			openLoadMoreRows[ openLoadMoreRows.length - 1 ].parent.level >=
				row.level
		) {
			closeLoadMoreRow( rowIndex - 1 );
		}
		const paginationInfo = row.isExpanded
			? hierarchyPagination.getPaginationInfo( row.id )
			: undefined;
		if ( hasLoadMoreRow( paginationInfo ) ) {
			openLoadMoreRows.push( { parent: row, paginationInfo } );
		}
	} );

	while ( openLoadMoreRows.length ) {
		closeLoadMoreRow( rows.length - 1 );
	}

	return loadMoreRows;
}
