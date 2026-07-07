/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { debounce, useEvent } from '@wordpress/compose';
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
import { normalizeGridSettings } from '../utils/normalize-grid-settings';
import { DEFAULT_ROW_HEIGHT } from '../utils/row-height-presets';
import type { WidgetGridSettings, DashboardWidget } from '../types';
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
 * Inline widget-instance edits stage live, then publish once the user pauses.
 * A single global timer, so editing several widgets settles into one save.
 */
const AUTO_SAVE_DELAY_MS = 5000;

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
 * `layout`/`onLayoutChange` here operate on the staging layer, not the
 * committed props. Mutations from compound children stay in staging until
 * `commit` publishes them on the consumer.
 */
interface InternalDashboardContextValue {
	widgetTypes: WidgetType[];
	isResolvingWidgetTypes: boolean;
	layout: DashboardWidget[];
	onLayoutChange: ( layout: DashboardWidget[] ) => void;
	onLayoutReset?: () => void;
	gridSettings: GridSettingsWithColumns;

	/**
	 * Publishes the staged layout when it differs from the committed
	 * prop. By default also exits edit mode; pass `{ exitEditMode: false }`
	 * for inline auto-saves that keep the current mode.
	 */
	commit: ( options?: CommitOptions ) => void;

	/**
	 * Reverts the staged layout and exits edit mode.
	 */
	cancel: () => void;

	/**
	 * Debounced auto-save for inline widget-instance edits. Controls call it
	 * after staging a change; a single global timer publishes once the edits
	 * settle. The settings drawer does not use it (it commits on Save).
	 */
	scheduleAutoSave: () => void;

	/**
	 * Publishes any pending auto-save immediately. Called when leaving the
	 * inline surface (opening the drawer, entering customize) so staged inline
	 * edits do not commingle with the drawer's explicit-save flow.
	 */
	flushAutoSave: () => void;

	hasUncommittedChanges: boolean;
	editMode: boolean;
	onEditChange?: ( next: boolean ) => void;
	resolveWidgetModule: ResolveWidgetModule;
}

interface CommitOptions {
	exitEditMode?: boolean;
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

	children: ReactNode;
}

/**
 * Provider for the dashboard's staging layer. Owns the staging copy of
 * `layout`; `commit` publishes it when it differs from the committed
 * prop, `cancel` reverts it.
 *
 * Staging re-syncs from the committed prop on prop change. In-flight
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

	const gridSettings = useMemo(
		() => resolveGridSettings( committedGridSettings ),
		[ committedGridSettings ]
	);

	const hasLayoutChanges = useMemo(
		() =>
			! fastDeepEqual(
				canonicalize( committedLayout ),
				canonicalize( stagingLayout )
			),
		[ committedLayout, stagingLayout ]
	);

	const hasUncommittedChanges = hasLayoutChanges;

	const commit = useCallback(
		( options?: CommitOptions ) => {
			if ( hasLayoutChanges ) {
				onLayoutChange( canonicalize( stagingLayout ) );
			}

			if ( options?.exitEditMode !== false ) {
				onEditChange?.( false );
			}
		},
		[ hasLayoutChanges, onLayoutChange, stagingLayout, onEditChange ]
	);

	// Auto-save for inline edits.
	// A single debounced timer publishes through `useEvent`, so it always
	// reads the latest `commit` (and so the current staging) without
	// resetting on staging re-renders.
	const publishAutoSave = useEvent( () => commit( { exitEditMode: false } ) );

	const scheduleAutoSave = useMemo(
		() => debounce( publishAutoSave, AUTO_SAVE_DELAY_MS ),
		[ publishAutoSave ]
	);

	const flushAutoSave = useCallback(
		() => scheduleAutoSave.flush(),
		[ scheduleAutoSave ]
	);

	// Entering customize flushes any pending inline save first, so it does not
	// commingle with the layout edit flow.
	useEffect( () => {
		if ( ! editMode ) {
			return;
		}

		scheduleAutoSave.flush();
	}, [ editMode, scheduleAutoSave ] );

	// Flush, not cancel, on unmount: an edit still inside the debounce window
	// must persist when the user navigates away from the dashboard.
	useEffect( () => () => scheduleAutoSave.flush(), [ scheduleAutoSave ] );

	const cancel = useCallback( () => {
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
			isResolvingWidgetTypes,
			layout: stagingLayout,
			onLayoutChange: setStagingLayout,
			onLayoutReset,
			gridSettings,
			commit,
			cancel,
			scheduleAutoSave,
			flushAutoSave,
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
			gridSettings,
			commit,
			cancel,
			scheduleAutoSave,
			flushAutoSave,
			hasUncommittedChanges,
			editMode,
			onEditChange,
			resolveWidgetModule,
		]
	);

	return <Context.Provider value={ value }>{ children }</Context.Provider>;
}
