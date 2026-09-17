import type { ReactNode, Ref, RefObject } from 'react';
import { useMergeRefs, useResizeObserver } from '@wordpress/compose';
import {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { LAYOUT_TABLE } from '../../constants';
import DataViewsContext from '../dataviews-context';

type BulkActionToolbarContextValue = {
	headerRef: Ref< HTMLTableSectionElement >;
	selectionRef: RefObject< HTMLInputElement >;
	bulkSelectionRef: RefObject< HTMLInputElement >;
	bulkActionsRef: RefObject< HTMLDivElement >;
	tableHeaderHeight?: number;
};

const BulkActionToolbarContext =
	createContext< BulkActionToolbarContextValue | null >( null );

export function BulkActionToolbarProvider( {
	children,
}: {
	children: ReactNode;
} ) {
	const { selection, view } = useContext( DataViewsContext );
	const isTable = view.type === LAYOUT_TABLE;
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
		<BulkActionToolbarContext.Provider
			value={ {
				headerRef: mergedTableHeaderRef,
				selectionRef: tableSelectionRef,
				bulkSelectionRef,
				bulkActionsRef,
				tableHeaderHeight,
			} }
		>
			{ children }
		</BulkActionToolbarContext.Provider>
	);
}

export default BulkActionToolbarContext;
