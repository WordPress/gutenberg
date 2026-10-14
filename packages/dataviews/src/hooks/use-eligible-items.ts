import { useSelect } from '@wordpress/data';
import type { Action } from '../types';

/**
 * Hook to get the items an action is eligible for. An action without
 * `isEligible` is eligible for every item.
 *
 * `isEligible` receives the registry `useSelect` passes to its callback, so
 * the eligibility is evaluated again when the data it reads changes.
 *
 * @param action The action.
 * @param items  The items.
 * @return The items the action is eligible for.
 */
export default function useEligibleItems< Item >(
	action: Action< Item >,
	items: Item[]
): Item[] {
	return useSelect(
		( select, registry ) =>
			items.filter(
				( item ) =>
					! action.isEligible ||
					action.isEligible( item, { registry } )
			),
		[ action, items ]
	);
}
