/**
 * WordPress dependencies
 */
import { useReducer, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { ViewportState, Size } from '../../core/types';
import {
	viewportReducer,
	DEFAULT_VIEWPORT_STATE,
} from '../../core/viewport-state';

export interface UseViewportStateReturn {
	viewport: ViewportState;
	setViewportZoom: ( zoom: number ) => void;
	/** Zooms to a new level while keeping the current view centre stationary. */
	setViewportZoomAtCenter: ( zoom: number ) => void;
	setViewportPan: ( pan: { x: number; y: number } ) => void;
	setCanvasSize: ( size: Size ) => void;
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

	const setViewportZoomAtCenter = useCallback( ( zoom: number ) => {
		dispatch( { type: 'SET_VIEWPORT_ZOOM_AT_CENTER', payload: zoom } );
	}, [] );

	const setViewportPan = useCallback( ( pan: { x: number; y: number } ) => {
		dispatch( { type: 'SET_VIEWPORT_PAN', payload: pan } );
	}, [] );

	const setCanvasSize = useCallback( ( size: Size ) => {
		dispatch( { type: 'SET_CANVAS_SIZE', payload: size } );
	}, [] );

	const resetViewport = useCallback( () => {
		dispatch( { type: 'RESET_VIEWPORT' } );
	}, [] );

	return {
		viewport,
		setViewportZoom,
		setViewportZoomAtCenter,
		setViewportPan,
		setCanvasSize,
		resetViewport,
	};
}
