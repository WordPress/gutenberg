/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * Internal dependencies
 */
import type { DashboardWidget, GridTilePlacement } from '../../types';
import type { WidgetType } from '../../../widget-primitives';

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
 * (matching the `widget.json` schema).
 * @param widgetType
 * @param initialAttributes
 */
export function createDashboardWidget< T >(
	widgetType: WidgetType,
	initialAttributes?: T
): DashboardWidget< T > {
	return {
		uuid: uuid(),
		type: widgetType.name,
		attributes:
			initialAttributes ?? ( widgetType.example?.attributes as T ),
		placement: DEFAULT_PLACEMENT,
	};
}
