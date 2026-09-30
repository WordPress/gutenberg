import type {
	WidgetAction,
	WidgetRuntimeAction,
} from '@wordpress/widget-primitives';

/**
 * Upgrades a declared action with the runtime one carrying its `id`. The
 * runtime action keeps the declared `icon` and `relevance` it leaves out;
 * the label and the fulfillment are always its own.
 *
 * @param {WidgetAction}        declared The declared action.
 * @param {WidgetRuntimeAction} runtime  The runtime action taking its place.
 */
function upgradeDeclaredAction(
	declared: WidgetAction,
	runtime: WidgetRuntimeAction
): WidgetRuntimeAction {
	const { icon, relevance } = declared;

	return {
		...( icon !== undefined && { icon } ),
		...( relevance !== undefined && { relevance } ),
		...runtime,
	};
}

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
		if ( ! replacement ) {
			return action;
		}

		byId.delete( action.id );
		return upgradeDeclaredAction( action, replacement );
	} );

	return [ ...merged, ...byId.values() ];
}
