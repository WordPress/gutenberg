import type { WidgetAction, WidgetType } from '@wordpress/widget-primitives';

/**
 * Splits a widget type's declared actions across the chrome's two surfaces:
 * the footer takes `relevance: 'high'`, the More menu takes the rest.
 * Full-bleed widgets have no chrome to host a footer, so every action stays
 * in the menu. Both surfaces read this one rule so they cannot drift.
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

	return {
		footer: actions.filter( ( action ) => action.relevance === 'high' ),
		menu: actions.filter( ( action ) => action.relevance !== 'high' ),
	};
}
