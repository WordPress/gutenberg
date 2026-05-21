/**
 * Internal dependencies
 */
import type { DashboardWidget } from '../../types';

/**
 * Returns a layout with the widget matching `uuid` removed.
 *
 * @param layout Layout to filter.
 * @param uuid   Instance id to remove.
 */
export function removeWidgetFromLayout(
	layout: DashboardWidget[],
	uuid: string
): DashboardWidget[] {
	return layout.filter( ( widget ) => widget.uuid !== uuid );
}
