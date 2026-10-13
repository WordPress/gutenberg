import { useRef } from '@wordpress/element';
import { useEvent } from '@wordpress/compose';
import type { HierarchicalRow } from './get-hierarchical-rows';

/**
 * Tracks the rendered tree rows so a Load more row can move focus once it
 * goes away: to the first row it loaded, else to the parent's toggle
 * button, else to the table or the empty state.
 *
 * @param renderedRows The visible rows in hierarchical order.
 */
export default function useHierarchyFocus< Item >(
	renderedRows: HierarchicalRow< Item >[]
) {
	const rowRefs = useRef< Map< string, HTMLTableRowElement > >( new Map() );
	const tableRef = useRef< HTMLTableElement | null >( null );
	const emptyRef = useRef< HTMLDivElement | null >( null );

	const getRowRef =
		( id: string ) => ( element: HTMLTableRowElement | null ) => {
			if ( element ) {
				rowRefs.current.set( id, element );
			} else {
				rowRefs.current.delete( id );
			}
		};

	const moveFocus = useEvent(
		( parentId: string | null, previousRowId?: string ) => {
			const previousIndex = renderedRows.findIndex(
				( row ) => row.id === previousRowId
			);
			const nextRow =
				previousRowId === undefined || previousIndex !== -1
					? renderedRows[ previousIndex + 1 ]
					: undefined;
			const parentIndex = renderedRows.findIndex(
				( row ) => row.id === parentId
			);
			const loadedRow =
				nextRow &&
				( parentId === null ||
					( parentIndex !== -1 &&
						nextRow.level > renderedRows[ parentIndex ].level ) )
					? rowRefs.current.get( nextRow.id )
					: undefined;
			(
				loadedRow ??
				( parentId !== null
					? rowRefs.current
							.get( parentId )
							?.querySelector< HTMLButtonElement >(
								'.dataviews-view-table__hierarchy-toggle'
							)
					: null ) ??
				tableRef.current ??
				emptyRef.current
			)?.focus();
		}
	);

	return { tableRef, emptyRef, getRowRef, moveFocus };
}
