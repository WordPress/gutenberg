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
	WidgetDashboardContextValue,
	WidgetErrorConfig,
	WidgetInstance,
	WidgetType,
} from './types';

const DEFAULT_MIN_COLUMN_WIDTH = 350;
const DEFAULT_COLLAPSE_WIDTH = 640;
const DEFAULT_ROW_HEIGHT = 200;
const DEFAULT_SPACING = 4;
const DEFAULT_RESOLVE_WIDGET_MODULE: ResolveWidgetModule = ( moduleId ) =>
	import( /* webpackIgnore: true */ moduleId );

/**
 * Rich state distributed to every compound component inside `WidgetDashboard`.
 * Not exported — compounds that need the full state use
 * `useDashboardInternalContext()`. Public consumers use
 * `useWidgetDashboardContext()` for the narrow, stable shape.
 */
interface InternalDashboardContextValue {
	id: string;
	widgetTypes: WidgetType[];
	layout: WidgetInstance[];
	onLayoutChange: ( layout: WidgetInstance[] ) => void;
	editMode: boolean;
	onEditChange?: ( next: boolean ) => void;
	resolveWidgetModule: ResolveWidgetModule;
	columns?: number;
	minColumnWidth: number;
	collapseWidth: number;
	rowHeight: number | 'auto';
	spacing: number;
	onWidgetError?: (
		uid: string,
		error: WidgetErrorConfig | true | null
	) => void;
}

const Context = createContext< InternalDashboardContextValue | null >( null );

/**
 * Access the dashboard identity (the `id` prop passed to `WidgetDashboard`).
 *
 * Primary use case: scoping persistence keys and extensibility filters to a
 * specific dashboard when multiple coexist in the same admin (core,
 * WooCommerce, third-party).
 */
export function useWidgetDashboardContext(): WidgetDashboardContextValue {
	const ctx = useContext( Context );
	if ( ! ctx ) {
		throw new Error(
			'useWidgetDashboardContext must be used within a WidgetDashboard.'
		);
	}
	return { id: ctx.id };
}

/**
 * Compound-internal hook — exposes the full provider state. Not part of the
 * public API; lives in the same module so compound components can reach the
 * state without widening `WidgetDashboardContextValue`.
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
	id: string;
	widgetTypes: WidgetType[];
	layout: WidgetInstance[];
	onLayoutChange: ( layout: WidgetInstance[] ) => void;
	editMode?: boolean;
	onEditChange?: ( next: boolean ) => void;
	resolveWidgetModule?: ResolveWidgetModule;
	columns?: number;
	minColumnWidth?: number;
	collapseWidth?: number;
	rowHeight?: number | 'auto';
	spacing?: number;
	onWidgetError?: (
		uid: string,
		error: WidgetErrorConfig | true | null
	) => void;
	children: ReactNode;
}

export function WidgetDashboardProvider( {
	id,
	widgetTypes,
	layout,
	onLayoutChange,
	editMode = false,
	onEditChange,
	resolveWidgetModule = DEFAULT_RESOLVE_WIDGET_MODULE,
	columns,
	minColumnWidth = DEFAULT_MIN_COLUMN_WIDTH,
	collapseWidth = DEFAULT_COLLAPSE_WIDTH,
	rowHeight = DEFAULT_ROW_HEIGHT,
	spacing = DEFAULT_SPACING,
	onWidgetError,
	children,
}: ProviderProps ) {
	const value = useMemo< InternalDashboardContextValue >(
		() => ( {
			id,
			widgetTypes,
			layout,
			onLayoutChange,
			editMode,
			onEditChange,
			resolveWidgetModule,
			columns,
			minColumnWidth,
			collapseWidth,
			rowHeight,
			spacing,
			onWidgetError,
		} ),
		[
			id,
			widgetTypes,
			layout,
			onLayoutChange,
			editMode,
			onEditChange,
			resolveWidgetModule,
			columns,
			minColumnWidth,
			collapseWidth,
			rowHeight,
			spacing,
			onWidgetError,
		]
	);

	return <Context.Provider value={ value }>{ children }</Context.Provider>;
}
