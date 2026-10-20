import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	DEFAULT_ROW_HEIGHT,
	rescaleLayout,
	ROW_HEIGHT_PRESETS,
} from '@wordpress/widget-dashboard';
import type {
	DashboardWidget,
	LayoutGeometry,
} from '@wordpress/widget-dashboard';

const SCOPE = 'core/dashboard';
const KEY = 'dashboardLayout';
const LEGACY_SETTINGS_KEY = 'dashboardGridSettings';

const EMPTY_LAYOUT: DashboardWidget[] = [];

/**
 * Column count every layout counted against before the record carried a
 * geometry. Frozen: it describes data that is no longer written.
 */
const LEGACY_COLUMNS = 4;

/**
 * Identifier of a dashboard, structured as `<plugin>_<page>` to mirror
 * the underscore form produced by the wp-build pipeline (see
 * `{{PREFIX}}_{{PAGE_SLUG_UNDERSCORE}}` in the page templates).
 */
export type DashboardName = `${ string }_${ string }`;

/**
 * The persisted shape: the layout and the geometry it was saved under.
 */
interface StoredLayout {
	geometry: LayoutGeometry;
	widgets: DashboardWidget[];
}

function isPositive( value: unknown ): value is number {
	return typeof value === 'number' && Number.isFinite( value ) && value > 0;
}

function isGeometry( value: unknown ): value is LayoutGeometry {
	if ( ! value || typeof value !== 'object' ) {
		return false;
	}
	const { columns, rowHeight } = value as Partial< LayoutGeometry >;
	return isPositive( columns ) && isPositive( rowHeight );
}

/**
 * The geometry a layout without a stamp was saved under: four columns of
 * the row height the removed Layout settings drawer persisted, snapped to
 * its presets the way the dashboard rendered it, or 300px when it never did.
 *
 * @param settings The stored `dashboardGridSettings` preference, if any.
 * @return The geometry to read a plain layout array with.
 */
function legacyGeometry( settings: unknown ): LayoutGeometry {
	const rowHeight = ( settings as { rowHeight?: unknown } | undefined )
		?.rowHeight;
	if ( ! isPositive( rowHeight ) ) {
		return { columns: LEGACY_COLUMNS, rowHeight: DEFAULT_ROW_HEIGHT };
	}
	const snapped = Object.values( ROW_HEIGHT_PRESETS ).reduce(
		( closest, preset ) =>
			Math.abs( preset - rowHeight ) < Math.abs( closest - rowHeight )
				? preset
				: closest
	);
	return { columns: LEGACY_COLUMNS, rowHeight: snapped };
}

/*
 * A plain array predates the record and counts as legacy. A record with an
 * unreadable stamp was still written by stamping code, so it counts as
 * current: nothing moves.
 */
function readStored(
	value: unknown,
	legacy: LayoutGeometry,
	current: LayoutGeometry
): StoredLayout {
	if ( Array.isArray( value ) ) {
		return { geometry: legacy, widgets: value };
	}
	const record = value as Partial< StoredLayout > | undefined;
	if ( ! record || ! Array.isArray( record.widgets ) ) {
		return { geometry: current, widgets: EMPTY_LAYOUT };
	}
	return {
		geometry: isGeometry( record.geometry ) ? record.geometry : current,
		widgets: record.widgets,
	};
}

/**
 * Hook for managing dashboard layout preferences.
 *
 * Returns the persisted layout in the geometry the dashboard renders with,
 * a setter that writes through to the preferences store, and a reset action
 * that fetches the dashboard's registered default from the REST API and
 * applies it locally.
 *
 * Spans are relative to the geometry they were saved under, so the
 * preference holds a record of the layout and that geometry, and a record
 * whose geometry differs from the current one is rescaled on read. A plain
 * array, saved before the record existed, and the registered default count
 * as four columns of the row height the dashboard rendered with at the time.
 *
 * @param dashboardName Identifier of the dashboard as produced by the
 *                      build pipeline. Used as the `{name}` segment of
 *                      the default-layout route.
 * @param geometry      Geometry the dashboard renders with, compared by
 *                      value.
 * @return Tuple `[ layout, setLayout, resetLayout ]`.
 */
export function useDashboardLayout(
	dashboardName: DashboardName,
	geometry: LayoutGeometry
): [
	DashboardWidget[],
	( layout: DashboardWidget[] ) => void,
	() => Promise< void >,
] {
	const { stored, legacySettings } = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		return {
			stored: get( SCOPE, KEY ) as unknown,
			legacySettings: get( SCOPE, LEGACY_SETTINGS_KEY ) as unknown,
		};
	}, [] );

	const { columns, rowHeight } = geometry;
	const layout = useMemo( () => {
		const current = { columns, rowHeight };
		const { geometry: from, widgets } = readStored(
			stored,
			legacyGeometry( legacySettings ),
			current
		);
		return rescaleLayout( widgets, from, current );
	}, [ stored, legacySettings, columns, rowHeight ] );

	const { set } = useDispatch( preferencesStore );

	function setLayout( widgets: DashboardWidget[] ) {
		const record: StoredLayout = {
			geometry: { columns, rowHeight },
			widgets,
		};
		void set( SCOPE, KEY, record );
	}

	async function resetLayout() {
		const fresh = ( await apiFetch( {
			path: `/wp/v2/dashboards/${ dashboardName }/default-layout`,
		} ) ) as DashboardWidget[];

		setLayout(
			rescaleLayout( fresh, legacyGeometry( legacySettings ), {
				columns,
				rowHeight,
			} )
		);
	}

	return [ layout, setLayout, resetLayout ];
}
