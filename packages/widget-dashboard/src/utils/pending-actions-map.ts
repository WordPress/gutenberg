import { observableMap } from '@wordpress/compose';
import type { ObservableMap } from '@wordpress/compose';

/**
 * The callback actions of each instance whose promise has not settled, by
 * uuid. Held by the dashboard, so the state outlives the surface that ran
 * the action.
 */
export type PendingActionsMap = ObservableMap< string, ReadonlySet< string > >;

export function createPendingActionsMap(): PendingActionsMap {
	return observableMap();
}

/**
 * Marks one action of an instance pending or settled.
 *
 * @param {PendingActionsMap} map      The dashboard's map.
 * @param {string}            uuid     The instance.
 * @param {string}            actionId The action.
 * @param {boolean}           pending  Whether its promise is still settling.
 */
export function setActionPending(
	map: PendingActionsMap,
	uuid: string,
	actionId: string,
	pending: boolean
): void {
	const next = new Set( map.get( uuid ) );
	if ( pending ) {
		next.add( actionId );
	} else {
		next.delete( actionId );
	}

	if ( next.size > 0 ) {
		map.set( uuid, next );
	} else {
		map.delete( uuid );
	}
}
