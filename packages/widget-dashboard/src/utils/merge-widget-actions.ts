import type {
	WidgetAction,
	WidgetRuntimeAction,
} from '@wordpress/widget-primitives';

/**
 * Joins a type's declared actions with the ones its mounted instance
 * declares. A runtime action carrying a declared `id` takes that action's
 * position; the rest follow in their own order. An `id` the runtime list
 * repeats keeps its first entry.
 *
 * @param {WidgetAction[]}        declared The type's declared actions.
 * @param {WidgetRuntimeAction[]} runtime  The instance's runtime actions.
 * @return {WidgetRuntimeAction[]} The actions the surfaces place.
 */
export function mergeWidgetActions(
	declared: WidgetAction[],
	runtime: WidgetRuntimeAction[]
): WidgetRuntimeAction[] {
	if ( runtime.length === 0 ) {
		return declared;
	}

	const byId = new Map< string, WidgetRuntimeAction >();
	runtime.forEach( ( action ) => {
		if ( ! byId.has( action.id ) ) {
			byId.set( action.id, action );
		}
	} );

	const merged: WidgetRuntimeAction[] = declared.map( ( action ) => {
		const replacement = byId.get( action.id );
		byId.delete( action.id );
		return replacement ?? action;
	} );

	return [ ...merged, ...byId.values() ];
}
