/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../context/dashboard-context';
import { useWidgetContext } from '../context/widget-context';

/**
 * Returns a callback that removes a widget instance from the dashboard
 * layout.
 *
 * When the dashboard is not in edit mode, the removal commits immediately
 * so persisted layout state updates without an extra Done action. In edit
 * mode, removal is staged like other layout mutations until the user
 * commits or cancels.
 *
 * @param uuid Optional instance id. When omitted, uses the widget under
 *             the current `useWidgetContext()` subtree.
 */
export function useRemoveDashboardWidget( uuid?: string ): () => void {
	const widgetContext = useWidgetContext();
	const { removeDashboardWidget } = useDashboardInternalContext();

	return useCallback( () => {
		const targetUuid = uuid ?? widgetContext?.uuid;

		if ( ! targetUuid ) {
			throw new Error(
				'useRemoveDashboardWidget() requires a widget uuid. Pass uuid explicitly or call from within a widget render subtree.'
			);
		}

		removeDashboardWidget( targetUuid );
	}, [ uuid, widgetContext?.uuid, removeDashboardWidget ] );
}
