import type {
	HierarchyPagination,
	HierarchyPaginationInfo,
} from '../../../types';
import type { TreeRow } from './get-tree-rows';

export interface HierarchyContinuation< Item > {
	parent: TreeRow< Item >;
	paginationInfo: HierarchyPaginationInfo;
}

export function hasHierarchyContinuation(
	paginationInfo: HierarchyPaginationInfo | undefined
): paginationInfo is HierarchyPaginationInfo {
	return !! (
		paginationInfo &&
		( paginationInfo.hasMore ||
			paginationInfo.isLoading ||
			( typeof paginationInfo.error === 'string' &&
				paginationInfo.error ) )
	);
}

/**
 * Places each expanded parent's continuation row after its last visible
 * descendant. Keys are the indexes of the rows the continuations follow.
 *
 * @param rows                Visible rows in hierarchical order.
 * @param hierarchyPagination Per-level pagination state.
 */
export default function getHierarchyContinuations< Item >(
	rows: TreeRow< Item >[],
	hierarchyPagination: HierarchyPagination
): Map< number, HierarchyContinuation< Item >[] > {
	const continuations = new Map< number, HierarchyContinuation< Item >[] >();
	const openContinuations: HierarchyContinuation< Item >[] = [];
	const closeContinuation = ( rowIndex: number ) => {
		const continuation = openContinuations.pop();
		if ( continuation ) {
			const current = continuations.get( rowIndex ) ?? [];
			current.push( continuation );
			continuations.set( rowIndex, current );
		}
	};

	rows.forEach( ( row, rowIndex ) => {
		while (
			openContinuations.length &&
			openContinuations[ openContinuations.length - 1 ].parent.level >=
				row.level
		) {
			closeContinuation( rowIndex - 1 );
		}

		const paginationInfo = row.isExpanded
			? hierarchyPagination.getPaginationInfo( row.id )
			: undefined;
		if ( hasHierarchyContinuation( paginationInfo ) ) {
			openContinuations.push( { parent: row, paginationInfo } );
		}
	} );

	while ( openContinuations.length ) {
		closeContinuation( rows.length - 1 );
	}

	return continuations;
}
