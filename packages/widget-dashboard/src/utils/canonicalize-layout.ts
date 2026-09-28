import type { DashboardWidget } from '../types';

/**
 * Canonical form of a layout: widgets sorted by `placement.order` (falling
 * back to array index), then `order` stripped since position now implies
 * it. The single positional encoding shared by the renderer, the commit
 * payload, and the staging enforcement.
 *
 * Returns `layout` itself when it is already canonical, and keeps the
 * reference of every widget without an `order` to strip, so untouched
 * layouts stay identity-comparable.
 *
 * @param {DashboardWidget[]} layout Layout to canonicalize.
 * @return {DashboardWidget[]} The canonical layout.
 */
export function canonicalizeLayout(
	layout: DashboardWidget[]
): DashboardWidget[] {
	const indexed = layout.map( ( widget, index ) => ( {
		widget,
		order: widget.placement?.order ?? index,
	} ) );

	indexed.sort( ( a, b ) => a.order - b.order );

	let changed = false;
	const canonical = indexed.map( ( { widget }, index ) => {
		if ( widget !== layout[ index ] ) {
			changed = true;
		}
		if ( ! widget.placement || ! ( 'order' in widget.placement ) ) {
			return widget;
		}
		changed = true;
		const { order: _stripped, ...placement } = widget.placement;
		return { ...widget, placement };
	} );

	return changed ? canonical : layout;
}
