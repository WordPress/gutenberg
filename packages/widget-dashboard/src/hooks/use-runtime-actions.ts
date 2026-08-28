import { useObservableValue } from '@wordpress/compose';
import type { WidgetRuntimeAction } from '@wordpress/widget-primitives';
import { useDashboardInternalContext } from '../context/dashboard-context';

const NO_RUNTIME_ACTIONS: WidgetRuntimeAction[] = [];

/**
 * The actions one mounted instance declares at runtime; a stable empty
 * list while it declares none. Subscribes to that instance only.
 *
 * @param {string} uuid The instance.
 */
export function useRuntimeActions( uuid: string ): WidgetRuntimeAction[] {
	const { runtimeActions } = useDashboardInternalContext();

	return useObservableValue( runtimeActions, uuid ) ?? NO_RUNTIME_ACTIONS;
}
