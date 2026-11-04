import { useObservableValue } from '@wordpress/compose';
import type { WidgetRuntimeAction } from '@wordpress/widget-primitives';
import { useDashboardInternalContext } from '../context/dashboard-context';

const NO_RUNTIME_ACTIONS: WidgetRuntimeAction[] = [];

/**
 * The runtime actions of one instance: what its first mounted render
 * declares, so a copy of the tile never takes them over.
 *
 * @param {string} uuid The instance.
 */
export function useRuntimeActions( uuid: string ): WidgetRuntimeAction[] {
	const { runtimeActions } = useDashboardInternalContext();
	const [ first ] =
		useObservableValue( runtimeActions, uuid )?.values() ?? [];

	return first ?? NO_RUNTIME_ACTIONS;
}
