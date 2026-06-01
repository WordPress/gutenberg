/**
 * Internal dependencies
 */
import type { ViewportState, ViewportAction } from './types';

export const DEFAULT_VIEWPORT_STATE: ViewportState = {
	zoom: 1,
	pan: { x: 0, y: 0 },
};

export function viewportReducer(
	state: ViewportState,
	action: ViewportAction
): ViewportState {
	switch ( action.type ) {
		case 'SET_VIEWPORT_ZOOM': {
			const zoom = Math.min( 4, Math.max( 0.1, action.payload ) );
			return zoom === state.zoom ? state : { ...state, zoom };
		}
		case 'SET_VIEWPORT_PAN': {
			const { x, y } = action.payload;
			return x === state.pan.x && y === state.pan.y
				? state
				: { ...state, pan: action.payload };
		}
		case 'RESET_VIEWPORT':
			return state.zoom === DEFAULT_VIEWPORT_STATE.zoom &&
				state.pan.x === DEFAULT_VIEWPORT_STATE.pan.x &&
				state.pan.y === DEFAULT_VIEWPORT_STATE.pan.y
				? state
				: DEFAULT_VIEWPORT_STATE;
	}
}
