import { observableMap } from '@wordpress/compose';
import type { ObservableMap } from '@wordpress/compose';
import type { WidgetRuntimeAction } from '@wordpress/widget-primitives';

/**
 * What each mounted render of an instance declares, in mount order, keyed by
 * uuid. A drag preview is a second render of its instance.
 */
export type RuntimeActionsMap = ObservableMap<
	string,
	ReadonlyMap< string, WidgetRuntimeAction[] >
>;

export function createRuntimeActionsMap(): RuntimeActionsMap {
	return observableMap();
}

/**
 * Replaces what one render of an instance declares; an empty list clears it.
 *
 * @param {RuntimeActionsMap}     map      The dashboard's map.
 * @param {string}                uuid     The instance.
 * @param {string}                renderId The render declaring.
 * @param {WidgetRuntimeAction[]} actions  The actions it declares.
 */
export function declareRuntimeActions(
	map: RuntimeActionsMap,
	uuid: string,
	renderId: string,
	actions: WidgetRuntimeAction[]
): void {
	const declared = map.get( uuid );
	if ( actions.length === 0 && ! declared?.has( renderId ) ) {
		return;
	}

	const next = new Map( declared );
	if ( actions.length > 0 ) {
		next.set( renderId, actions );
	} else {
		next.delete( renderId );
	}

	if ( next.size > 0 ) {
		map.set( uuid, next );
	} else {
		map.delete( uuid );
	}
}
