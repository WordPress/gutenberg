import { useLayoutEffect } from '@wordpress/element';
import { useWidgetHost } from '../widget-host';
import type { WidgetRuntimeAction } from '../types';

const NO_ACTIONS: WidgetRuntimeAction[] = [];

/**
 * Declares the actions a mounted widget wants placed by its host, computed
 * from what the render knows: loaded data, the instance's attributes, a
 * feature gate. The list is the instance's whole set and replaces the
 * previous one whenever its identity changes, so memoize it and leave out
 * the entries that do not apply right now: an action is conditioned by not
 * declaring it. A runtime action with a declared action's `id` takes its
 * place, keeping the declared `icon` and `relevance` it leaves out.
 *
 * Returns whether the host took the actions. `false` means the host has no
 * `actions` capability and the widget keeps rendering its own affordances.
 *
 * @param {WidgetRuntimeAction[]} actions The actions to place.
 * @return {boolean} Whether a host places them.
 */
export function useWidgetActions( actions: WidgetRuntimeAction[] ): boolean {
	const declare = useWidgetHost().actions?.declare;

	// Layout effect, so the host paints the actions with the same frame.
	useLayoutEffect( () => {
		declare?.( actions );
	}, [ declare, actions ] );

	useLayoutEffect( () => () => declare?.( NO_ACTIONS ), [ declare ] );

	return !! declare;
}
