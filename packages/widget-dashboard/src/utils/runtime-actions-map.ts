import { observableMap } from '@wordpress/compose';
import type { ObservableMap } from '@wordpress/compose';
import type { WidgetRuntimeAction } from '@wordpress/widget-primitives';

/**
 * The actions each mounted instance declares at runtime, keyed by instance
 * uuid. Surfaces subscribe per instance, so a declaration re-renders the
 * chrome of that tile and nothing else.
 */
export type RuntimeActionsMap = ObservableMap< string, WidgetRuntimeAction[] >;

export function createRuntimeActionsMap(): RuntimeActionsMap {
	return observableMap();
}

/**
 * Replaces an instance's runtime actions; an empty list clears its entry.
 *
 * @param {RuntimeActionsMap}     map     The dashboard's map.
 * @param {string}                uuid    The instance.
 * @param {WidgetRuntimeAction[]} actions The actions it declares.
 */
export function declareRuntimeActions(
	map: RuntimeActionsMap,
	uuid: string,
	actions: WidgetRuntimeAction[]
): void {
	if ( actions.length > 0 ) {
		map.set( uuid, actions );
		return;
	}

	if ( map.get( uuid ) !== undefined ) {
		map.delete( uuid );
	}
}
