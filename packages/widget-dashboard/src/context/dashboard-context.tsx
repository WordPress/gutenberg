/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6/index.js';
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
import type {
	ResolveWidgetModule,
	WidgetType,
} from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { DEFAULT_GRID } from '../utils/default-grid';
import { computeGridModelChange } from '../utils/grid-model-change';
import { normalizeGridSettings } from '../utils/normalize-grid-settings';
import { DEFAULT_ROW_HEIGHT } from '../utils/row-height-presets';
import type {
	WidgetGridModel,
	WidgetGridSettings,
	DashboardWidget,
} from '../types';
import { WIDGET_DASHBOARD_COLUMN_COUNT } from '../types';

type GridSettingsWithColumns = WidgetGridSettings & { columns: number };

function resolveGridSettings(
	settings: WidgetGridSettings
): GridSettingsWithColumns {
	const normalized = normalizeGridSettings( settings, DEFAULT_ROW_HEIGHT );
	return {
		...normalized,
		columns: WIDGET_DASHBOARD_COLUMN_COUNT,
	};
}

const DEFAULT_RESOLVE_WIDGET_MODULE: ResolveWidgetModule = ( moduleId ) =>
	import( /* webpackIgnore: true */ moduleId );

/**
 * Canonical form of `layout`: widgets sorted by `placement.order` (falling
 * back to array index), then `order` stripped since position now implies it.
 * Used both as the comparison form for `hasUncommittedChanges` (so a change
 * and its undo compare equal) and as the publish form, keeping persisted
 * payloads free of redundant `order` fields.
 *
 * @param {DashboardWidget[]} layout Layout to canonicalize.
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
	isResolvingWidgetTypes: boolean;
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
	 * counterparts. By default also exits edit mode; pass
	 * `{ exitEditMode: false }` when committing from the layout
	 * settings drawer so customize mode stays active.
	 */
	commit: ( options?: CommitOptions ) => void;

	/**
	 * Switches the layout model, updates staging, and publishes
	 * immediately — equivalent to changing the model in layout
	 * settings and clicking Save.
	 */
	commitGridModelChange: ( targetModel: WidgetGridModel ) => void;

	/**
	 * Reverts staging slices. By default reverts both layout and grid
	 * settings and exits edit mode. Pass `{ exitEditMode: false }` when
	 * dismissing the layout settings drawer. Pass `{ revertLayout: false }`
	 * to revert only grid settings (preserves in-progress widget layout
	 * edits while customize mode is active).
	 */
	cancel: ( options?: CancelOptions ) => void;

	hasUncommittedChanges: boolean;
	editMode: boolean;
	onEditChange?: ( next: boolean ) => void;
	resolveWidgetModule: ResolveWidgetModule;
}

interface CommitOptions {
	exitEditMode?: boolean;
}

interface CancelOptions {
	exitEditMode?: boolean;
	revertLayout?: boolean;
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
	widgetTypes: WidgetType[];
	isResolvingWidgetTypes?: boolean;
	layout: DashboardWidget[];

	/**
	 * Fired on commit when the staged layout differs from `layout`.
	 */
	onLayoutChange: ( layout: DashboardWidget[] ) => void;

	/**
	 * Optional reset action surfaced by the bundled `Actions`.
	 */
	onLayoutReset?: () => void;

	editMode?: boolean;
	onEditChange?: ( next: boolean ) => void;

	/**
	 * Overrides the default `import()` resolution of
	 * `WidgetType.renderModule`.
	 */
	resolveWidgetModule?: ResolveWidgetModule;

	gridSettings?: WidgetGridSettings;

	/**
	 * Fired on commit when the staged settings differ from
	 * `gridSettings`.
	 */
	onGridSettingsChange?: ( gridSettings: WidgetGridSettings ) => void;

	children: ReactNode;
}

/**
 * Provider for the dashboard's staging layer. Owns staging copies of
 * `layout` and `gridSettings`; `commit` publishes whichever slice
 * differs from its committed prop, `cancel` reverts both.
 *
 * Staging re-syncs from the committed props on prop change. In-flight
 * edits are dropped silently when an external update (cross-tab commit,
 * reset, websocket push) lands. Consumers that cannot tolerate this
 * loss should mediate the prop updates before forwarding them here.
 *
 * @param {ProviderProps} props Component props.
 */
export function WidgetDashboardProvider( {
	widgetTypes,
	isResolvingWidgetTypes = false,
	layout: committedLayout,
	onLayoutChange,
	onLayoutReset,
	editMode = false,
	onEditChange,
	resolveWidgetModule = DEFAULT_RESOLVE_WIDGET_MODULE,
	gridSettings: committedGridSettings = DEFAULT_GRID,
	onGridSettingsChange,
	children,
}: ProviderProps ): React.ReactNode {
	const [ stagingLayout, setStagingLayout ] =
		useState< DashboardWidget[] >( committedLayout );

	// External change in `layout` (consumer-side reset, cross-tab sync,
	// websocket push, etc.) drops any in-flight staging edits without
	// surfacing a warning. See the provider JSDoc for the trade-off.
	useEffect( () => {
		setStagingLayout( committedLayout );
	}, [ committedLayout ] );

	const [ stagingGridSettings, setStagingGridSettings ] =
		useState< WidgetGridSettings >( () =>
			normalizeGridSettings( committedGridSettings, DEFAULT_ROW_HEIGHT )
		);

	// Same external-resync semantics as `stagingLayout`.
	useEffect( () => {
		setStagingGridSettings(
			normalizeGridSettings( committedGridSettings, DEFAULT_ROW_HEIGHT )
		);
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

	const commit = useCallback(
		( options?: CommitOptions ) => {
			if ( hasLayoutChanges ) {
				onLayoutChange( canonicalize( stagingLayout ) );
			}

			if ( hasGridSettingsChanges ) {
				onGridSettingsChange?.(
					normalizeGridSettings(
						stagingGridSettings,
						DEFAULT_ROW_HEIGHT
					)
				);
			}

			if ( options?.exitEditMode !== false ) {
				onEditChange?.( false );
			}
		},
		[
			hasLayoutChanges,
			hasGridSettingsChanges,
			onLayoutChange,
			onGridSettingsChange,
			stagingLayout,
			stagingGridSettings,
			onEditChange,
		]
	);

	const cancel = useCallback(
		( options?: CancelOptions ) => {
			if ( options?.revertLayout !== false ) {
				setStagingLayout( committedLayout );
			}
			setStagingGridSettings( committedGridSettings );
			if ( options?.exitEditMode !== false ) {
				onEditChange?.( false );
			}
		},
		[ committedLayout, committedGridSettings, onEditChange ]
	);

	const commitGridModelChange = useCallback(
		( targetModel: WidgetGridModel ) => {
			const next = computeGridModelChange( {
				layout: stagingLayout,
				gridSettings: stagingGridSettings,
				targetModel,
			} );

			if ( ! next ) {
				return;
			}

			setStagingLayout( next.layout );
			setStagingGridSettings( next.gridSettings );
			onLayoutChange( canonicalize( next.layout ) );
			onGridSettingsChange?.(
				normalizeGridSettings( next.gridSettings, DEFAULT_ROW_HEIGHT )
			);
			onEditChange?.( false );
		},
		[
			stagingLayout,
			stagingGridSettings,
			onLayoutChange,
			onGridSettingsChange,
			onEditChange,
		]
	);

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
			isResolvingWidgetTypes,
			layout: stagingLayout,
			onLayoutChange: setStagingLayout,
			onLayoutReset,
			gridSettings: resolveGridSettings( stagingGridSettings ),
			onGridSettingsChange: setStagingGridSettings,
			canEditGridSettings,
			resetGridSettings,
			commit,
			commitGridModelChange,
			cancel,
			hasUncommittedChanges,
			editMode,
			onEditChange,
			resolveWidgetModule,
		} ),
		[
			widgetTypes,
			isResolvingWidgetTypes,
			stagingLayout,
			onLayoutReset,
			stagingGridSettings,
			canEditGridSettings,
			resetGridSettings,
			commit,
			commitGridModelChange,
			cancel,
			hasUncommittedChanges,
			editMode,
			onEditChange,
			resolveWidgetModule,
		]
	);

	return <Context.Provider value={ value }>{ children }</Context.Provider>;
}
