import type { WidgetTypesState, WidgetType } from '../types';

export function getWidgetTypes( state: WidgetTypesState ): WidgetType[] {
	return Object.values( state.widgetTypes );
}

export function getWidgetType(
	state: WidgetTypesState,
	name: string
): WidgetType | undefined {
	return state.widgetTypes[ name ];
}
