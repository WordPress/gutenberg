import type {
	WidgetAction,
	WidgetRuntimeAction,
} from '@wordpress/widget-primitives';

/*
 * The runtime action keeps the declared `icon` and `relevance` it leaves out.
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
 * Joins the type's declared actions with the instance's runtime ones. A
 * runtime action carrying a declared `id` takes that action's position;
 * the rest follow in their own order.
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

	const byId = new Map< string, WidgetRuntimeAction >(
		runtime.map( ( action ) => [ action.id, action ] as const )
	);

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
