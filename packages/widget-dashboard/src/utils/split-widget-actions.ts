import type { WidgetAction, WidgetType } from '@wordpress/widget-primitives';

/**
 * Splits a widget type's actions across the chrome surfaces: the footer
 * takes `relevance: 'high'` and `'medium'`, the More menu the rest.
 * Full-bleed widgets have no footer, so every action stays in the menu.
 *
 * @param widgetType The widget type whose actions are routed.
 */
export function splitWidgetActions( widgetType?: WidgetType ): {
	footer: WidgetAction[];
	menu: WidgetAction[];
} {
	const actions = widgetType?.actions ?? [];

	if ( widgetType?.presentation === 'full-bleed' ) {
		return { footer: [], menu: actions };
	}

	const isPromoted = ( action: WidgetAction ) =>
		action.relevance === 'high' || action.relevance === 'medium';

	return {
		footer: actions.filter( isPromoted ),
		menu: actions.filter( ( action ) => ! isPromoted( action ) ),
	};
}
