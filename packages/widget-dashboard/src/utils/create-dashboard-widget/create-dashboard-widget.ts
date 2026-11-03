import { v4 as uuid } from 'uuid';
import type { WidgetType } from '@wordpress/widget-primitives';
import type { DashboardWidget, GridTilePlacement } from '../../types';

const DEFAULT_PLACEMENT: GridTilePlacement = {
	width: 1,
	height: 2,
	order: 0,
};

/**
 * Create a new dashboard widget from a widget type.
 *
 * Generates a unique id and applies default placement. If no initial
 * attributes are provided, falls back to the type's `example.attributes`
 * (matching the `widget.json` schema). The placement width is the host's
 * insertion default when the dashboard declares width choices and the
 * first choice's value is passed; otherwise it stays a one-column-span
 * tile.
 *
 * @param widgetType        Source widget type.
 * @param initialAttributes Initial attributes; default to the type's example.
 * @param defaultWidth      The width new instances start at — a width
 *                          choice value when the dashboard declares them.
 */
export function createDashboardWidget< T >(
	widgetType: WidgetType,
	initialAttributes?: T,
	defaultWidth?: GridTilePlacement[ 'width' ]
): DashboardWidget< T > {
	return {
		uuid: uuid(),
		type: widgetType.name,
		attributes:
			initialAttributes ?? ( widgetType.example?.attributes as T ),
		placement:
			defaultWidth === undefined || defaultWidth === 1
				? DEFAULT_PLACEMENT
				: { ...DEFAULT_PLACEMENT, width: defaultWidth },
	};
}
