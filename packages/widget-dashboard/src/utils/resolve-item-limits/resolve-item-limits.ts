import type { GridItemLimits } from '@wordpress/grid';
import type { WidgetFootprint, WidgetType } from '@wordpress/widget-primitives';
import type { DashboardWidget } from '../../types';

/**
 * How this host appraises each footprint, in pixels. The surface quantizes
 * a floor to whole tracks of its current geometry and saturates it at the
 * column count, so one declaration lands differently as the geometry
 * changes. `glance` has no entry: no floor.
 *
 * The widths sit under what one column (222px) and two columns (468px)
 * offer at 960px of container width with a 24px gap, so a card takes one
 * column and a strip or a panel two across the whole four-column band.
 */
export const FOOTPRINT_LIMITS: Readonly<
	Partial< Record< WidgetFootprint, GridItemLimits > >
> = {
	strip: { minWidth: 440 },
	card: { minWidth: 200, minHeight: 200 },
	panel: { minWidth: 440, minHeight: 360 },
};

/**
 * Per-instance pixel limits for the surface, keyed by widget uuid, from the
 * footprint each placed widget's type declares.
 *
 * @param layout      Placed widgets.
 * @param widgetTypes Registered widget types.
 * @return Limits keyed by uuid, or `undefined` when no placed widget has a
 *         floor, so the surface takes its unbounded path.
 */
export function resolveItemLimits(
	layout: DashboardWidget[],
	widgetTypes: WidgetType[]
): Record< string, GridItemLimits > | undefined {
	let limits: Record< string, GridItemLimits > | undefined;
	for ( const widget of layout ) {
		const footprint = widgetTypes.find(
			( type ) => type.name === widget.type
		)?.footprint;
		const floor = footprint ? FOOTPRINT_LIMITS[ footprint ] : undefined;
		if ( ! floor ) {
			continue;
		}
		limits ??= {};
		limits[ widget.uuid ] = floor;
	}
	return limits;
}
