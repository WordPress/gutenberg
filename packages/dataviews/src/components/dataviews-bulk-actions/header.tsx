import type { CSSProperties, ReactNode } from 'react';
import { useMergeRefs, useResizeObserver } from '@wordpress/compose';
import { useContext, useEffect, useRef, useState } from '@wordpress/element';
import { LAYOUT_GRID, LAYOUT_TABLE } from '../../constants';
import DataViewsContext from '../dataviews-context';
import { BulkActions, useSomeItemHasAPossibleBulkAction } from '.';
import TableSelectionContext from './table-selection-context';

type DataViewsBulkActionsHeaderProps = {
	children: ReactNode;
};

export default function DataViewsBulkActionsHeader( {
	children,
}: DataViewsBulkActionsHeaderProps ) {
	const {
		actions = [],
		data,
		hasInitiallyLoaded,
		isLoading,
		selection,
		view,
	} = useContext( DataViewsContext );
	const isTable = view.type === LAYOUT_TABLE;
	// Default bulk-action headers are supported by table and grid only.
	const hasBulkActionsHeader =
		useSomeItemHasAPossibleBulkAction( actions, data ) &&
		[ LAYOUT_TABLE, LAYOUT_GRID ].includes( view.type );
	const tableHeaderRef = useRef< HTMLTableSectionElement >( null );
	const tableSelectionRef = useRef< HTMLInputElement >( null );
	const bulkSelectionRef = useRef< HTMLInputElement >( null );
	const bulkActionsRef = useRef< HTMLDivElement >( null );
	const [ tableHeaderHeight, setTableHeaderHeight ] = useState< number >();
	const tableHeaderResizeObserverRef =
		useResizeObserver< HTMLTableSectionElement >(
			( [ entry ] ) => {
				if ( ! isTable ) {
					return;
				}
				setTableHeaderHeight( entry.borderBoxSize[ 0 ].blockSize );
			},
			{ box: 'border-box' }
		);
	const mergedTableHeaderRef = useMergeRefs( [
		tableHeaderRef,
		tableHeaderResizeObserverRef,
	] );
	const hadSelectionRef = useRef( false );
	useEffect( () => {
		if ( ! isTable ) {
			return;
		}
		const tableHead = tableHeaderRef.current;
		const ownerDocument = tableHead?.ownerDocument;
		if (
			selection.length &&
			tableHead?.contains( ownerDocument?.activeElement ?? null )
		) {
			bulkSelectionRef.current?.focus();
		} else if (
			hadSelectionRef.current &&
			! selection.length &&
			( ownerDocument?.activeElement === ownerDocument?.body ||
				bulkActionsRef.current?.contains(
					ownerDocument?.activeElement ?? null
				) )
		) {
			tableSelectionRef.current?.focus();
		}
		hadSelectionRef.current = selection.length > 0;
	}, [ selection.length, isTable ] );

	return (
		<TableSelectionContext.Provider
			value={
				isTable
					? {
							headerRef: mergedTableHeaderRef,
							selectionRef: tableSelectionRef,
					  }
					: null
			}
		>
			{ /* Stay outside the scroll container so auto-height layouts stick to the page. */ }
			{ hasInitiallyLoaded && hasBulkActionsHeader && (
				<div
					className={
						isTable
							? 'dataviews-view-table__bulk-actions-overlay'
							: 'dataviews-view-grid__bulk-actions-header'
					}
					hidden={ isTable && ! selection.length }
					ref={ bulkActionsRef }
					style={
						isTable && tableHeaderHeight
							? ( {
									'--wp-dataviews-table-header-height': `${ tableHeaderHeight }px`,
							  } as CSSProperties )
							: undefined
					}
					// @ts-expect-error `inert` is not declared in React 18's HTML attribute types.
					inert={ isLoading ? 'true' : undefined }
				>
					<BulkActions
						selectionCheckboxRef={
							isTable ? bulkSelectionRef : undefined
						}
					/>
				</div>
			) }
			{ children }
		</TableSelectionContext.Provider>
	);
}
