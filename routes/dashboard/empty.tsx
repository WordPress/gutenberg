/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from './dashboard-context';

interface EmptyProps {
	children: ReactNode;
}

/**
 * Renders its children only when the dashboard's `layout` is empty. Pair
 * with `WidgetDashboard.Widgets` inside `WidgetDashboard` so the empty
 * state shows up in place of the grid until widgets are added.
 * @param root0
 * @param root0.children
 */
export function Empty( { children }: EmptyProps ) {
	const { layout } = useDashboardInternalContext();
	if ( layout.length > 0 ) {
		return null;
	}
	return <>{ children }</>;
}
