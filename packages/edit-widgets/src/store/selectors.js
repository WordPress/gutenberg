/**
 * External dependencies
 */
import { toArray } from 'lodash';

export function getWidgetAreas( state ) {
	return toArray( state.widgetAreas );
}

export function getWidgetAreaBlocks( state, widgetAreaId ) {
	return state.widgetAreaEditors[ widgetAreaId ] &&
		state.widgetAreaEditors[ widgetAreaId ].blocks;
}
