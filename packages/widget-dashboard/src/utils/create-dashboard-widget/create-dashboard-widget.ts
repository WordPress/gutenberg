/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import type {
	WidgetInitialSize,
	WidgetType,
} from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import type { DashboardWidget, GridTilePlacement } from '../../types';

const DEFAULT_PLACEMENT: GridTilePlacement = {
	width: 1,
	height: 2,
	order: 0,
};

const INITIAL_SIZE_PLACEMENTS: Record< WidgetInitialSize, GridTilePlacement > =
	{
		compact: {
			width: 1,
			height: 1,
			order: 0,
		},
		regular: DEFAULT_PLACEMENT,
		wide: {
			width: 2,
			height: 1,
			order: 0,
		},
		large: {
			width: 2,
			height: 2,
			order: 0,
		},
	};

/**
 * Create a new dashboard widget from a widget type.
 *
 * Generates a unique id and applies the dashboard placement for the type's
 * `initialSize`. If no initial attributes are provided, falls back to the type's
 * `example.attributes`.
 *
 * @param widgetType        Source widget type.
 * @param initialAttributes Initial attributes; default to the type's example.
 */
export function createDashboardWidget< T >(
	widgetType: WidgetType,
	initialAttributes?: T
): DashboardWidget< T > {
	const placement =
		INITIAL_SIZE_PLACEMENTS[ widgetType.initialSize ?? 'regular' ] ??
		DEFAULT_PLACEMENT;

	return {
		uuid: uuid(),
		type: widgetType.name,
		attributes:
			initialAttributes ?? ( widgetType.example?.attributes as T ),
		placement: { ...placement },
	};
}
