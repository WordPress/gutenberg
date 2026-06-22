/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import type { DashboardWidget, GridTilePlacement } from '../../types';

const DEFAULT_PLACEMENT: GridTilePlacement = {
	width: 1,
	height: 2,
	order: 0,
};

/**
 * Create a new dashboard widget from a widget type.
 *
 * Generates a unique id and applies the dashboard fallback placement,
 * overridden by the type's supported `defaultPlacement` fields. If no
 * initial attributes are provided, falls back to the type's
 * `example.attributes`.
 *
 * @param widgetType        Source widget type.
 * @param initialAttributes Initial attributes; default to the type's example.
 */
export function createDashboardWidget< T >(
	widgetType: WidgetType,
	initialAttributes?: T
): DashboardWidget< T > {
	const { width, height } = widgetType.defaultPlacement ?? {};

	return {
		uuid: uuid(),
		type: widgetType.name,
		attributes:
			initialAttributes ?? ( widgetType.example?.attributes as T ),
		placement: {
			...DEFAULT_PLACEMENT,
			...( width !== undefined ? { width } : {} ),
			...( height !== undefined ? { height } : {} ),
		},
	};
}
