import type {
	WidgetRuntimeAction,
	WidgetType,
} from '@wordpress/widget-primitives';
import { mergeWidgetActions } from './merge-widget-actions';

/**
 * Splits a widget's actions across the chrome surfaces: the footer takes
 * `relevance: 'high'` and `'medium'`, the More menu the rest. Full-bleed
 * widgets have no footer, so every action stays in the menu.
 *
 * @param {WidgetType | undefined} widgetType     The widget type.
 * @param {WidgetRuntimeAction[]}  runtimeActions The instance's actions.
 */
export function splitWidgetActions(
	widgetType?: WidgetType,
	runtimeActions: WidgetRuntimeAction[] = []
): {
	footer: WidgetRuntimeAction[];
	menu: WidgetRuntimeAction[];
} {
	const actions = mergeWidgetActions(
		widgetType?.actions ?? [],
		runtimeActions
	);

	if ( widgetType?.presentation === 'full-bleed' ) {
		return { footer: [], menu: actions };
	}

	const isPromoted = ( action: WidgetRuntimeAction ) =>
		action.relevance === 'high' || action.relevance === 'medium';

	return {
		footer: actions.filter( isPromoted ),
		menu: actions.filter( ( action ) => ! isPromoted( action ) ),
	};
}
