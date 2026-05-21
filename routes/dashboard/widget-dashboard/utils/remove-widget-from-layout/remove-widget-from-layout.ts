/**
 * Internal dependencies
 */
import type { DashboardWidget } from '../../types';

/**
 * Returns a copy of `layout` without the widget matching `uuid`.
 *
 * @param layout Widget instances.
 * @param uuid   Instance id to remove.
 */
export function removeWidgetFromLayout(
	layout: DashboardWidget[],
	uuid: string
): DashboardWidget[] {
	return layout.filter( ( widget ) => widget.uuid !== uuid );
}
