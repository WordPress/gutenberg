/**
 * External dependencies
 */
import type { ReactNode } from 'react';
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	ResolveWidgetModule,
	WidgetGridSettings,
	DashboardWidget,
	WidgetType,
} from '../types';

/*
 * Defaults for the active grid model. Applied when the consumer omits
 * `gridSettings` entirely; if `gridSettings` is provided, the consumer's
 * shape passes through untouched and missing fields fall back to whatever
 * defaults the grid model itself supplies.
 */
const DEFAULT_GRID: WidgetGridSettings = {
	minColumnWidth: 350,
	rowHeight: 200,
	spacing: 4,
};
const DEFAULT_RESOLVE_WIDGET_MODULE: ResolveWidgetModule = ( moduleId ) =>
	import( /* webpackIgnore: true */ moduleId );

/**
 * Returns the canonical form of `layout`.
 *
 * Sorts widgets by their declared `placement.order` (falling back to
 * the array index when omitted) and then strips `order` from each
 * placement, since the order is now implicit in the array position.
 *
 * Used in two places: as the comparison form for
 * `hasUncommittedChanges` (so a swap and its undo are reported as
 * equal even though the staged copy carries explicit `0, 1, …` orders
 * the grid wrote during the drag) and as the publish form for
 * `commitLayout`, so the persisted payload stays free of redundant
 * `order` fields and matches what the comparison treats as canonical.
 *
 * @param layout Layout to canonicalize.
 * @return Layout sorted by display order with `order` stripped from
 *         every placement.
 */
function canonicalize( layout: DashboardWidget[] ): DashboardWidget[] {
	const indexed = layout.map( ( widget, index ) => ( {
		widget,
		order: widget.placement?.order ?? index,
	} ) );
	indexed.sort( ( a, b ) => a.order - b.order );
	return indexed.map( ( { widget } ) => {
		if ( ! widget.placement ) {
			return widget;
		}
		const { order: _stripped, ...placement } = widget.placement;
		return { ...widget, placement };
	} );
}

/**
 * Rich state distributed to every compound component inside `WidgetDashboard`.
 * Internal — compounds reach the full state via `useDashboardInternalContext()`.
 *
 * `layout` and `onLayoutChange` here operate on the staging layer, not the
 * committed prop. Mutations from compound children stay in staging until
 * `commitLayout` fires `onLayoutChange` on the consumer.
 */
interface InternalDashboardContextValue {
	widgetTypes: WidgetType[];
	layout: DashboardWidget[];
	onLayoutChange: ( layout: DashboardWidget[] ) => void;
	onLayoutReset?: () => void;
	commitLayout: () => void;
	cancelLayout: () => void;
	hasUncommittedChanges: boolean;
	editMode: boolean;
	onEditChange?: ( next: boolean ) => void;
	resolveWidgetModule: ResolveWidgetModule;
	gridSettings: WidgetGridSettings;
}

const Context = createContext< InternalDashboardContextValue | null >( null );

/**
 * Compound-internal hook — exposes the full provider state. Not part of the
 * public API; lives in the same module so compound components can reach the
 * state directly.
 */
export function useDashboardInternalContext(): InternalDashboardContextValue {
	const ctx = useContext( Context );
	if ( ! ctx ) {
		throw new Error(
			'Dashboard compound used outside a WidgetDashboard subtree.'
		);
	}
	return ctx;
}

interface ProviderProps {
	widgetTypes: WidgetType[];
	layout: DashboardWidget[];
	onLayoutChange: ( layout: DashboardWidget[] ) => void;
	onLayoutReset?: () => void;
	editMode?: boolean;
	onEditChange?: ( next: boolean ) => void;
	resolveWidgetModule?: ResolveWidgetModule;
	gridSettings?: WidgetGridSettings;
	children: ReactNode;
}

export function WidgetDashboardProvider( {
	widgetTypes,
	layout: committedLayout,
	onLayoutChange,
	onLayoutReset,
	editMode = false,
	onEditChange,
	resolveWidgetModule = DEFAULT_RESOLVE_WIDGET_MODULE,
	gridSettings = DEFAULT_GRID,
	children,
}: ProviderProps ) {
	const [ stagingLayout, setStagingLayout ] =
		useState< DashboardWidget[] >( committedLayout );

	useEffect( () => {
		setStagingLayout( committedLayout );
	}, [ committedLayout ] );

	const hasUncommittedChanges = useMemo(
		() =>
			! fastDeepEqual(
				canonicalize( committedLayout ),
				canonicalize( stagingLayout )
			),
		[ committedLayout, stagingLayout ]
	);

	const commitLayout = useCallback( () => {
		if ( hasUncommittedChanges ) {
			onLayoutChange( canonicalize( stagingLayout ) );
		}
		onEditChange?.( false );
	}, [ hasUncommittedChanges, onLayoutChange, stagingLayout, onEditChange ] );

	const cancelLayout = useCallback( () => {
		setStagingLayout( committedLayout );
		onEditChange?.( false );
	}, [ committedLayout, onEditChange ] );

	useEffect( () => {
		if ( stagingLayout.length === 0 ) {
			onEditChange?.( true );
		}
		// Only react to the layout count flipping to zero; firing on every
		// onEditChange identity change would also reopen edit mode after the
		// user explicitly closed it on a non-empty layout.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ stagingLayout.length === 0 ] );

	const value = useMemo< InternalDashboardContextValue >(
		() => ( {
			widgetTypes,
			layout: stagingLayout,
			onLayoutChange: setStagingLayout,
			onLayoutReset,
			commitLayout,
			cancelLayout,
			hasUncommittedChanges,
			editMode,
			onEditChange,
			resolveWidgetModule,
			gridSettings,
		} ),
		[
			widgetTypes,
			stagingLayout,
			onLayoutReset,
			commitLayout,
			cancelLayout,
			hasUncommittedChanges,
			editMode,
			onEditChange,
			resolveWidgetModule,
			gridSettings,
		]
	);

	return <Context.Provider value={ value }>{ children }</Context.Provider>;
}
