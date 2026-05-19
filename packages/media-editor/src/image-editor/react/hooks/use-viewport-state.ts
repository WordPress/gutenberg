/**
 * WordPress dependencies
 */
import { useReducer, useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ViewportState } from '../../core/types';
import {
	viewportReducer,
	DEFAULT_VIEWPORT_STATE,
} from '../../core/viewport-state';

export interface UseViewportStateReturn {
	viewport: ViewportState;
	/**
	 * Unused in the current Cropper implementation — scaffolded for the
	 * upcoming navigator panel (viewport zoom slider).
	 */
	setViewportZoom: ( zoom: number ) => void;
	setViewportPan: ( pan: { x: number; y: number } ) => void;
	resetViewport: () => void;
}

export function useViewportState(): UseViewportStateReturn {
	const [ viewport, dispatch ] = useReducer(
		viewportReducer,
		DEFAULT_VIEWPORT_STATE
	);

	const setViewportZoom = useCallback( ( zoom: number ) => {
		dispatch( { type: 'SET_VIEWPORT_ZOOM', payload: zoom } );
	}, [] );

	const setViewportPan = useCallback( ( pan: { x: number; y: number } ) => {
		dispatch( { type: 'SET_VIEWPORT_PAN', payload: pan } );
	}, [] );

	const resetViewport = useCallback( () => {
		dispatch( { type: 'RESET_VIEWPORT' } );
	}, [] );

	return useMemo(
		() => ( { viewport, setViewportZoom, setViewportPan, resetViewport } ),
		[ viewport, setViewportZoom, setViewportPan, resetViewport ]
	);
}
