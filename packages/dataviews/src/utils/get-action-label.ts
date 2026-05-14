/**
 * Internal dependencies
 */
import type { Action } from '../types';

/**
 * Resolve an action's label for the given items. Actions accept either a
 * static string label or a function that receives the items the action
 * will operate on; this helper centralises the type discrimination so
 * callers don't repeat it at every render site.
 *
 * @param action The action whose label to resolve.
 * @param items  The items that the action will operate on (a single-item
 *               array for per-row actions, the full selection for bulk).
 * @return       The resolved label string.
 */
export default function getActionLabel< Item >(
	action: Pick< Action< Item >, 'label' >,
	items: Item[]
): string {
	return typeof action.label === 'string'
		? action.label
		: action.label( items );
}
