import type {
	DashboardWidget,
	GridTilePlacement,
	WidgetGridSettings,
} from '../../types';
import { WIDGET_DASHBOARD_COLUMN_COUNT } from '../../types';
import { DEFAULT_ROW_HEIGHT } from '../row-height-presets';

/**
 * The geometry a layout's spans count against. Spans are relative: a
 * `width` of 2 is half of four columns and a sixth of twelve, a `height` of
 * 3 is 948px on 300px rows and 168px on 40px rows. A host that changes its
 * geometry rescales stored layouts through {@link rescaleLayout}.
 */
export interface LayoutGeometry {
	/**
	 * Column count the widths count against: the count on a wide container.
	 */
	columns: number;

	/**
	 * Row height in pixels the heights count against.
	 */
	rowHeight: number;
}

/*
 * Gap between tracks the surfaces resolve to by default
 * (`--wpds-dimension-gap-xl`). The surfaces read the real gap per density,
 * so the height conversion is approximate by nature; one constant keeps
 * it stable across hosts.
 */
const TRACK_GAP = 24;

/**
 * The geometry a dashboard's layouts count against, from its grid settings.
 * A stepped count takes its widest step. A floor without a count, or an
 * `'auto'` step, takes the package default, since the floor fits a
 * different count at every width.
 *
 * @param gridSettings Grid settings the dashboard renders with.
 * @return The geometry to stamp layouts with.
 */
export function layoutGeometry(
	gridSettings: WidgetGridSettings
): LayoutGeometry {
	const { columns } = gridSettings;
	let count = WIDGET_DASHBOARD_COLUMN_COUNT;
	if ( typeof columns === 'number' ) {
		count = columns;
	} else if ( columns && typeof columns === 'object' ) {
		const steps = Object.values( columns );
		const counts = steps.filter(
			( step ): step is number => typeof step === 'number'
		);
		if ( counts.length > 0 && counts.length === steps.length ) {
			count = Math.max( ...counts );
		}
	}
	const rowHeight =
		gridSettings.model !== 'masonry' &&
		typeof gridSettings.rowHeight === 'number'
			? gridSettings.rowHeight
			: DEFAULT_ROW_HEIGHT;
	return { columns: count, rowHeight };
}

function sameGeometry( a: LayoutGeometry, b: LayoutGeometry ): boolean {
	return a.columns === b.columns && a.rowHeight === b.rowHeight;
}

/**
 * Re-expresses a layout authored against one geometry in another. Heights
 * keep their pixels: a tile three 300px rows tall becomes fifteen 40px rows
 * tall. Widths keep their proportion of the surface: three of four columns
 * become nine of twelve. `fill` and `full` need no translation and spans
 * never drop below one. Masonry placements carry no height and rescale in
 * width only.
 *
 * The layout is returned as-is when the geometries match, so a host can
 * compare identities to tell whether anything moved.
 *
 * @param layout Placed widgets.
 * @param from   Geometry the layout was authored against.
 * @param to     Geometry the dashboard renders with now.
 * @return The layout in the new geometry.
 */
export function rescaleLayout(
	layout: DashboardWidget[],
	from: LayoutGeometry,
	to: LayoutGeometry
): DashboardWidget[] {
	if ( sameGeometry( from, to ) ) {
		return layout;
	}

	const rows = ( height: number ) => {
		const px = height * from.rowHeight + ( height - 1 ) * TRACK_GAP;
		return Math.max(
			1,
			Math.round( ( px + TRACK_GAP ) / ( to.rowHeight + TRACK_GAP ) )
		);
	};
	const cols = ( width: number ) =>
		Math.max( 1, Math.round( ( width * to.columns ) / from.columns ) );

	let changed = false;
	const rescaled = layout.map( ( widget ) => {
		const placement = widget.placement as GridTilePlacement | undefined;
		if ( ! placement ) {
			return widget;
		}
		const next: GridTilePlacement = { ...placement };
		if ( typeof placement.width === 'number' ) {
			next.width = cols( placement.width );
		}
		if ( typeof placement.height === 'number' ) {
			next.height = rows( placement.height );
		}
		if (
			next.width === placement.width &&
			next.height === placement.height
		) {
			return widget;
		}
		changed = true;
		return { ...widget, placement: next };
	} );

	return changed ? rescaled : layout;
}
