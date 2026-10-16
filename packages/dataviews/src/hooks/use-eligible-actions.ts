import { useSelect } from '@wordpress/data';
import type { Action } from '../types';

/**
 * Hook to get the actions an item is eligible for. An action without
 * `isEligible` is eligible for every item.
 *
 * `isEligible` receives the registry `useSelect` passes to its callback, so
 * the eligibility is evaluated again when the data it reads changes.
 *
 * @param actions The actions.
 * @param item    The item.
 * @return The actions the item is eligible for.
 */
export default function useEligibleActions< Item >(
	actions: Action< Item >[],
	item: Item
): Action< Item >[] {
	return useSelect(
		( select, registry ) =>
			actions.filter(
				( action ) =>
					! action.isEligible ||
					action.isEligible( item, { registry } )
			),
		[ actions, item ]
	);
}
