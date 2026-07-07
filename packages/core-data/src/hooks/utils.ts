/**
 * WordPress dependencies
 */
import type { ResolutionStatus } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Status } from './constants';

/**
 * Normalizes a resolution status from the store into the resolution info
 * shared by the entity record hooks and `useQuerySelect`.
 *
 * @param resolutionStatus Status returned by the `getResolutionState` selector.
 * @return Resolution info object.
 */
export function getResolutionStatus( resolutionStatus?: ResolutionStatus ) {
	let status: Status;
	switch ( resolutionStatus ) {
		case 'resolving':
			status = Status.Resolving;
			break;
		case 'finished':
			status = Status.Success;
			break;
		case 'error':
			status = Status.Error;
			break;
		default:
			status = Status.Idle;
	}

	return {
		status,
		isResolving: status === Status.Resolving,
		hasStarted: status !== Status.Idle,
		hasResolved: status === Status.Success || status === Status.Error,
	};
}
