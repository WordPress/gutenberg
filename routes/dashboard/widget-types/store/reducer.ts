import type { WidgetTypesState } from '../types';

type Action =
	| {
			type: 'ADD_WIDGET_TYPE';
			widgetType: WidgetTypesState[ 'widgetTypes' ][ string ];
	  }
	| {
			type: 'REMOVE_WIDGET_TYPE';
			name: string;
	  };

const DEFAULT_STATE: WidgetTypesState[ 'widgetTypes' ] = {};

export default function widgetTypes(
	state = DEFAULT_STATE,
	action: Action
): typeof DEFAULT_STATE {
	switch ( action.type ) {
		case 'ADD_WIDGET_TYPE':
			return {
				...state,
				[ action.widgetType.name ]: action.widgetType,
			};

		case 'REMOVE_WIDGET_TYPE': {
			const { [ action.name ]: _, ...remaining } = state;
			return remaining;
		}
	}

	return state;
}
