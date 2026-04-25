/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { createContext, useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	ResolveWidgetModule,
	WidgetGridSettings,
	WidgetInstance,
	WidgetType,
} from './types';

/*
 * Defaults for the active grid model. Applied when the consumer omits
 * `grid` entirely; if `grid` is provided, the consumer's shape passes
 * through untouched and missing fields fall back to whatever defaults
 * the grid model itself supplies.
 */
const DEFAULT_GRID: WidgetGridSettings = {
	minColumnWidth: 350,
	rowHeight: 200,
	spacing: 4,
};
const DEFAULT_RESOLVE_WIDGET_MODULE: ResolveWidgetModule = ( moduleId ) =>
	import( /* webpackIgnore: true */ moduleId );

/**
 * Rich state distributed to every compound component inside `WidgetDashboard`.
 * Internal — compounds reach the full state via `useDashboardInternalContext()`.
 */
interface InternalDashboardContextValue {
	widgetTypes: WidgetType[];
	layout: WidgetInstance[];
	onLayoutChange: ( layout: WidgetInstance[] ) => void;
	editMode: boolean;
	onEditChange?: ( next: boolean ) => void;
	resolveWidgetModule: ResolveWidgetModule;
	grid: WidgetGridSettings;
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
	layout: WidgetInstance[];
	onLayoutChange: ( layout: WidgetInstance[] ) => void;
	editMode?: boolean;
	onEditChange?: ( next: boolean ) => void;
	resolveWidgetModule?: ResolveWidgetModule;
	grid?: WidgetGridSettings;
	children: ReactNode;
}

export function WidgetDashboardProvider( {
	widgetTypes,
	layout,
	onLayoutChange,
	editMode = false,
	onEditChange,
	resolveWidgetModule = DEFAULT_RESOLVE_WIDGET_MODULE,
	grid = DEFAULT_GRID,
	children,
}: ProviderProps ) {
	const value = useMemo< InternalDashboardContextValue >(
		() => ( {
			widgetTypes,
			layout,
			onLayoutChange,
			editMode,
			onEditChange,
			resolveWidgetModule,
			grid,
		} ),
		[
			widgetTypes,
			layout,
			onLayoutChange,
			editMode,
			onEditChange,
			resolveWidgetModule,
			grid,
		]
	);

	return <Context.Provider value={ value }>{ children }</Context.Provider>;
}
