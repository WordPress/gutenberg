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
		case 'SET_VIEWPORT_ZOOM':
			return {
				...state,
				zoom: Math.min( 4, Math.max( 0.1, action.payload ) ),
			};
		case 'SET_VIEWPORT_PAN':
			return { ...state, pan: action.payload };
		case 'RESET_VIEWPORT':
			return DEFAULT_VIEWPORT_STATE;
	}
}
