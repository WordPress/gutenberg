/**
 * Internal dependencies
 */
import type { ViewportState, ViewportAction } from './types';
import { MIN_VIEWPORT_ZOOM, MAX_VIEWPORT_ZOOM } from './constants';

export const DEFAULT_VIEWPORT_STATE: ViewportState = {
	zoom: 1,
	pan: { x: 0, y: 0 },
};

function clampViewportZoom( zoom: number ): number {
	return Math.min( MAX_VIEWPORT_ZOOM, Math.max( MIN_VIEWPORT_ZOOM, zoom ) );
}

export function viewportReducer(
	state: ViewportState,
	action: ViewportAction
): ViewportState {
	switch ( action.type ) {
		case 'SET_VIEWPORT_ZOOM':
			return { ...state, zoom: clampViewportZoom( action.payload ) };
		case 'SET_VIEWPORT_PAN':
			return { ...state, pan: action.payload };
		case 'RESET_VIEWPORT':
			return DEFAULT_VIEWPORT_STATE;
	}
}
