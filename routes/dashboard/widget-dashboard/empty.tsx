/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from './dashboard-context';

export interface EmptyProps {
	children: ReactNode;
}

function EmptyImpl( { children }: EmptyProps ) {
	const { layout } = useDashboardInternalContext();
	if ( layout.length > 0 ) {
		return null;
	}
	return <>{ children }</>;
}

/**
 * Renders its children only when the dashboard's `layout` is empty. Pair
 * with `WidgetDashboard.Widgets` inside `WidgetDashboard` so the empty
 * state shows up in place of the grid until widgets are added.
 */
export const Empty = EmptyImpl;
