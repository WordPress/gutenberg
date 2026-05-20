/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';
import type { ReactNode } from 'react';

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
 *
 * `widgets.tsx` also applies a hard-coded floor when `minColumnWidth`
 * resolves to `undefined`, to keep legibility intact for stored settings
 * that predate the layered model.
 */
const DEFAULT_GRID: WidgetGridSettings = {
	columns: 6,
	minColumnWidth: 350,
	rowHeight: 200,
};

type GridSettingsWithColumns = WidgetGridSettings & { columns: number };

function resolveGridSettings(
	settings: WidgetGridSettings
): GridSettingsWithColumns {
	return {
		...settings,
		columns: settings.columns ?? DEFAULT_GRID.columns!,
	};
}

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
 * @param {DashboardWidget[]} layout - Layout to canonicalize.
 * @return {DashboardWidget[]} Canonicalized layout.
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
 * `layout`/`onLayoutChange` and `gridSettings`/`onGridSettingsChange` here
 * operate on the staging layer, not the committed props. Mutations from
 * compound children stay in staging until `commit` publishes them on the
 * consumer.
 */
interface InternalDashboardContextValue {
	widgetTypes: WidgetType[];
	layout: DashboardWidget[];
	onLayoutChange: ( layout: DashboardWidget[] ) => void;
	onLayoutReset?: () => void;
	gridSettings: GridSettingsWithColumns;
	onGridSettingsChange: ( gridSettings: WidgetGridSettings ) => void;
	canEditGridSettings: boolean;

	/**
	 * Restores the staging copy of `gridSettings` to the package's
	 * built-in defaults. Does not touch the committed slice; the user
	 * must `commit` to publish the reset, or `cancel` to discard it.
	 */
	resetGridSettings: () => void;

	/**
	 * Publishes staged slices that differ from their committed
	 * counterparts, then exits edit mode. Best-effort atomic: no
	 * rollback if a callback throws.
	 */
	commit: () => void;

	/** Reverts both staging slices and exits edit mode. */
	cancel: () => void;

	hasUncommittedChanges: boolean;
	editMode: boolean;
	onEditChange?: ( next: boolean ) => void;
	resolveWidgetModule: ResolveWidgetModule;
}

const Context = createContext< InternalDashboardContextValue | null >( null );

/**
 * Compound-internal hook — exposes the full provider state.
 * Not part of the public API; lives in the same module
 * so compound components can reach the state directly.
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
	/**
	 * Widget types available for rendering.
	 */
	widgetTypes: WidgetType[];

	/**
	 * Committed layout.
	 */
	layout: DashboardWidget[];

	/**
	 * Fired on commit when the staged layout differs from `layout`.
	 */
	onLayoutChange: ( layout: DashboardWidget[] ) => void;

	/**
	 * Optional reset action surfaced by the bundled `Actions`.
	 */
	onLayoutReset?: () => void;

	/**
	 * Whether the dashboard is in edit mode.
	 */
	editMode?: boolean;

	/**
	 * Fired when edit mode toggles.
	 */
	onEditChange?: ( next: boolean ) => void;

	/**
	 * Overrides the default `import()` resolution of
	 * `WidgetType.renderModule`.
	 */
	resolveWidgetModule?: ResolveWidgetModule;

	/**
	 * Committed grid settings.
	 */
	gridSettings?: WidgetGridSettings;

	/**
	 * Fired on commit when the staged settings differ from
	 * `gridSettings`.
	 */
	onGridSettingsChange?: ( gridSettings: WidgetGridSettings ) => void;

	/**
	 * Compound subtree consuming the context.
	 */
	children: ReactNode;
}

/**
 * Provider for the dashboard's staging layer. Owns staging copies of
 * `layout` and `gridSettings`; `commit` publishes whichever slice
 * differs from its committed prop, `cancel` reverts both.
 *
 * Two invariants the provider does not enforce on its own:
 *
 * - The shared commit assumes the two slices are not edited
 *   simultaneously. The bundled `Actions` keeps the layout-edit and
 *   settings-drawer flows mutually exclusive; consumers that compose
 *   a different surface must uphold the same invariant or accept the
 *   cross-publish.
 * - Staging re-syncs from the committed props on prop change.
 *   In-flight edits are dropped silently when an external update
 *   (cross-tab commit, reset, websocket push) lands. Consumers that
 *   cannot tolerate this loss should mediate the prop updates before
 *   forwarding them here.
 *
 * @param {ProviderProps} props Provider props
 * @return {React.ReactNode} The provider component.
 */
export function WidgetDashboardProvider( {
	widgetTypes,
	layout: committedLayout,
	onLayoutChange,
	onLayoutReset,
	editMode = false,
	onEditChange,
	resolveWidgetModule = DEFAULT_RESOLVE_WIDGET_MODULE,
	gridSettings: committedGridSettings = DEFAULT_GRID,
	onGridSettingsChange,
	children,
}: ProviderProps ) {
	const [ stagingLayout, setStagingLayout ] =
		useState< DashboardWidget[] >( committedLayout );

	// External change in `layout` (consumer-side reset, cross-tab sync,
	// websocket push, etc.) drops any in-flight staging edits without
	// surfacing a warning. See the provider JSDoc for the trade-off.
	useEffect( () => {
		setStagingLayout( committedLayout );
	}, [ committedLayout ] );

	const [ stagingGridSettings, setStagingGridSettings ] =
		useState< WidgetGridSettings >( committedGridSettings );

	// Same external-resync semantics as `stagingLayout`.
	useEffect( () => {
		setStagingGridSettings( committedGridSettings );
	}, [ committedGridSettings ] );

	const hasLayoutChanges = useMemo(
		() =>
			! fastDeepEqual(
				canonicalize( committedLayout ),
				canonicalize( stagingLayout )
			),
		[ committedLayout, stagingLayout ]
	);

	const hasGridSettingsChanges = useMemo(
		() => ! fastDeepEqual( committedGridSettings, stagingGridSettings ),
		[ committedGridSettings, stagingGridSettings ]
	);

	const hasUncommittedChanges = hasLayoutChanges || hasGridSettingsChanges;

	const commit = useCallback( () => {
		if ( hasLayoutChanges ) {
			onLayoutChange( canonicalize( stagingLayout ) );
		}

		if ( hasGridSettingsChanges ) {
			onGridSettingsChange?.( stagingGridSettings );
		}

		onEditChange?.( false );
	}, [
		hasLayoutChanges,
		hasGridSettingsChanges,
		onLayoutChange,
		onGridSettingsChange,
		stagingLayout,
		stagingGridSettings,
		onEditChange,
	] );

	const cancel = useCallback( () => {
		setStagingLayout( committedLayout );
		setStagingGridSettings( committedGridSettings );
		onEditChange?.( false );
	}, [ committedLayout, committedGridSettings, onEditChange ] );

	const resetGridSettings = useCallback( () => {
		setStagingGridSettings( DEFAULT_GRID );
	}, [] );

	useEffect( () => {
		if ( stagingLayout.length === 0 ) {
			onEditChange?.( true );
		}

		// Only react to the layout count flipping to zero; firing on every
		// onEditChange identity change would also reopen edit mode after the
		// user explicitly closed it on a non-empty layout.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ stagingLayout.length === 0 ] );

	const canEditGridSettings = onGridSettingsChange !== undefined;

	const value = useMemo< InternalDashboardContextValue >(
		() => ( {
			widgetTypes,
			layout: stagingLayout,
			onLayoutChange: setStagingLayout,
			onLayoutReset,
			gridSettings: resolveGridSettings( stagingGridSettings ),
			onGridSettingsChange: setStagingGridSettings,
			canEditGridSettings,
			resetGridSettings,
			commit,
			cancel,
			hasUncommittedChanges,
			editMode,
			onEditChange,
			resolveWidgetModule,
		} ),
		[
			widgetTypes,
			stagingLayout,
			onLayoutReset,
			stagingGridSettings,
			canEditGridSettings,
			resetGridSettings,
			commit,
			cancel,
			hasUncommittedChanges,
			editMode,
			onEditChange,
			resolveWidgetModule,
		]
	);

	return <Context.Provider value={ value }>{ children }</Context.Provider>;
}
