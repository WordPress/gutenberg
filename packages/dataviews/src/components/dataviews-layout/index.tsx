import type { ComponentType } from 'react';
import { useContext, useEffect, useRef } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import DataViewsContext from '../dataviews-context';
import TableSelectionContext from './table-selection-context';
import { VIEW_LAYOUTS } from '../dataviews-layouts';
import {
	BulkActions,
	useSomeItemHasAPossibleBulkAction,
} from '../dataviews-bulk-actions';
import { LAYOUT_TABLE, LAYOUT_GRID } from '../../constants';
import { useDelayedLoading } from '../../hooks/use-delayed-loading';
import type { ViewBaseProps } from '../../types';

type DataViewsLayoutProps = {
	className?: string;
};

export default function DataViewsLayout( { className }: DataViewsLayoutProps ) {
	const {
		actions = [],
		data,
		fields,
		getItemId,
		getItemLevel,
		hasInitiallyLoaded,
		isLoading,
		view,
		onChangeView,
		selection,
		onChangeSelection,
		setOpenedFilter,
		onClickItem,
		isItemClickable,
		renderItemLink,
		defaultLayouts,
		containerRef,
		isDefaultUI,
		empty = <p>{ __( 'No results' ) }</p>,
	} = useContext( DataViewsContext );

	// Default bulk-action headers are supported by table and grid only.
	const hasBulkActionsHeader =
		useSomeItemHasAPossibleBulkAction( actions, data ) &&
		[ LAYOUT_TABLE, LAYOUT_GRID ].includes( view.type );
	const tableHeaderRef = useRef< HTMLTableSectionElement >( null );
	const tableSelectionRef = useRef< HTMLInputElement >( null );
	const bulkSelectionRef = useRef< HTMLInputElement >( null );
	const bulkActionsRef = useRef< HTMLDivElement >( null );
	const hadSelectionRef = useRef( false );
	useEffect( () => {
		if ( ! isDefaultUI || view.type !== LAYOUT_TABLE ) {
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
	}, [ selection.length, isDefaultUI, view.type ] );

	const isDelayedInitialLoading = useDelayedLoading( ! hasInitiallyLoaded, {
		delay: 200,
	} );
	// Until the initial data load completes, show a spinner (or nothing if fast).
	// After that, render the layout component which preserves previous data
	// while loading subsequent requests.
	if ( ! hasInitiallyLoaded ) {
		// If the initial data load is fast, don't show the loading state at all.
		if ( ! isDelayedInitialLoading ) {
			return null;
		}
		// If the initial data load takes more than 200ms, show the loading state.
		return (
			<div className="dataviews-loading">
				<p>
					<Spinner />
				</p>
			</div>
		);
	}

	const ViewComponent = VIEW_LAYOUTS.find(
		( v ) => v.type === view.type && defaultLayouts[ v.type ]
	)?.component as ComponentType< ViewBaseProps< any > >;

	return (
		<TableSelectionContext.Provider
			value={
				isDefaultUI && view.type === LAYOUT_TABLE
					? {
							headerRef: tableHeaderRef,
							selectionRef: tableSelectionRef,
					  }
					: null
			}
		>
			{ /* Stay outside the scroll container so auto-height layouts stick to the page. */ }
			{ isDefaultUI && hasBulkActionsHeader && (
				<div
					className={
						view.type === LAYOUT_TABLE
							? 'dataviews-view-table__bulk-actions-overlay'
							: 'dataviews-view-grid__bulk-actions-header'
					}
					hidden={ view.type === LAYOUT_TABLE && ! selection.length }
					ref={ bulkActionsRef }
					// @ts-expect-error `inert` is not declared in React 18's HTML attribute types.
					inert={ isLoading ? 'true' : undefined }
				>
					<BulkActions
						selectionCheckboxRef={
							view.type === LAYOUT_TABLE
								? bulkSelectionRef
								: undefined
						}
					/>
				</div>
			) }
			<div className="dataviews-layout__container" ref={ containerRef }>
				<ViewComponent
					className={ className }
					actions={ actions }
					data={ data }
					fields={ fields }
					getItemId={ getItemId }
					getItemLevel={ getItemLevel }
					isLoading={ isLoading }
					onChangeView={ onChangeView }
					onChangeSelection={ onChangeSelection }
					selection={ selection }
					setOpenedFilter={ setOpenedFilter }
					onClickItem={ onClickItem }
					renderItemLink={ renderItemLink }
					isItemClickable={ isItemClickable }
					view={ view }
					empty={ empty }
				/>
			</div>
		</TableSelectionContext.Provider>
	);
}
