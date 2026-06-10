/**
 * Internal dependencies
 */
import type { SetIsMatchingAction, ViewportState } from '../types';

/**
 * Returns an action object used in signalling that viewport queries have been
 * updated. Values are specified as an object of breakpoint query keys where
 * value represents whether query matches.
 * Ignored from documentation as it is for internal use only.
 *
 * @ignore
 *
 * @param values Breakpoint query matches.
 *
 * @return Action object.
 */
export function setIsMatching( values: ViewportState ): SetIsMatchingAction {
	return {
		type: 'SET_IS_MATCHING',
		values,
	};
}
