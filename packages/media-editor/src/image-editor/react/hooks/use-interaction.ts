/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { CropperState, Size } from '../../core/types';
import {
	InteractionController,
	type CropperInteractionActions,
} from '../../core/interaction-controller';

/**
 * The return type of the useInteraction hook.
 */
export interface UseInteractionReturn {
	/** Event handler props to spread on the container element. */
	handlers: {
		onPointerDown: ( e: React.PointerEvent ) => void;
		onTouchStart: ( e: React.TouchEvent ) => void;
		onKeyDown: ( e: React.KeyboardEvent ) => void;
	};
	/** Native wheel handler — must be registered with { passive: false }. */
	onWheelNative: ( e: WheelEvent ) => void;
	/** Whether a drag (pan) interaction is in progress. */
	isDragging: boolean;
	/** Whether a double-tap zoom animation is in progress. */
	isZooming: boolean;
}

/**
 * Options for the useInteraction hook.
 */
export interface UseInteractionOptions {
	/** Minimum zoom level. Defaults to MIN_ZOOM. */
	minZoom?: number;
	/** Maximum zoom level. Defaults to MAX_ZOOM. */
	maxZoom?: number;
	/** Zoom speed multiplier for wheel events. Defaults to 0.01. */
	zoomSpeed?: number;
	/** Pan step size in normalized coords for keyboard events. Defaults to 0.05. */
	keyboardStep?: number;
	/** Zoom level for double-tap zoom. Defaults to 2. */
	doubleTapZoom?: number;
	/** Fires when a continuous gesture begins (pan drag, pinch zoom). */
	onGestureStart?: () => void;
	/** Fires when a continuous gesture ends (pointer release). */
	onGestureEnd?: () => void;
}

/**
 * Mouse, touch, and keyboard event handling for pan, zoom,
 * and crop manipulation.
 *
 * Returns event handler props to spread on the container element.
 * Uses requestAnimationFrame for drag/pinch updates to avoid
 * layout thrashing.
 *
 * @param state         The current cropper state.
 * @param actions       Named state updates for cropper interactions.
 * @param containerSize The container dimensions in pixels.
 * @param imageSize     The rendered image dimensions in pixels.
 * @param options       Optional configuration for zoom and keyboard behavior.
 * @return Event handler props for the container element.
 */
export function useInteraction(
	state: CropperState,
	actions: CropperInteractionActions,
	containerSize: Size,
	imageSize?: Size,
	options?: UseInteractionOptions
): UseInteractionReturn {
	const [ isDragging, setIsDragging ] = useState( false );
	const [ isZooming, setIsZooming ] = useState( false );

	// Keep mutable refs so the controller always reads fresh values
	// without needing to be recreated.
	const stateRef = useRef( state );
	stateRef.current = state;
	const containerSizeRef = useRef( containerSize );
	containerSizeRef.current = containerSize;
	const imageSizeRef = useRef( imageSize );
	imageSizeRef.current = imageSize;
	const optionsRef = useRef( options );
	optionsRef.current = options;
	const actionsRef = useRef( actions );
	actionsRef.current = actions;

	const controllerRef = useRef< InteractionController | null >( null );

	// Create / destroy the controller. The controller reads all volatile
	// values through refs, so it can stay mounted across render updates.
	useEffect( () => {
		const controller = new InteractionController( {
			getState: () => stateRef.current,
			actions: {
				setPan: ( pan ) => actionsRef.current.setPan( pan ),
				setZoom: ( zoom ) => actionsRef.current.setZoom( zoom ),
				setZoomAtPoint: ( zoom, pan ) =>
					actionsRef.current.setZoomAtPoint( zoom, pan ),
				snapRotate90: ( direction ) =>
					actionsRef.current.snapRotate90( direction ),
			},
			getContainerSize: () => containerSizeRef.current,
			getImageSize: () => imageSizeRef.current,
			get minZoom() {
				return optionsRef.current?.minZoom;
			},
			get maxZoom() {
				return optionsRef.current?.maxZoom;
			},
			get zoomSpeed() {
				return optionsRef.current?.zoomSpeed;
			},
			get keyboardStep() {
				return optionsRef.current?.keyboardStep;
			},
			get doubleTapZoom() {
				return optionsRef.current?.doubleTapZoom;
			},
			onGestureStart: () => optionsRef.current?.onGestureStart?.(),
			onGestureEnd: () => optionsRef.current?.onGestureEnd?.(),
			onStatusChange: ( status ) => {
				setIsDragging( status.isDragging );
				setIsZooming( status.isZooming );
			},
		} );
		controllerRef.current = controller;
		return () => {
			controller.destroy();
			controllerRef.current = null;
		};
	}, [] );

	const onPointerDown = useCallback( ( e: React.PointerEvent ) => {
		const el = e.currentTarget as HTMLElement;
		controllerRef.current?.handlePointerDown( e.nativeEvent, el );
	}, [] );

	const onTouchStart = useCallback( ( e: React.TouchEvent ) => {
		const el = e.currentTarget as HTMLElement;
		const rect = el.getBoundingClientRect();
		controllerRef.current?.handleTouchStart(
			e.nativeEvent,
			rect,
			el.ownerDocument
		);
	}, [] );

	const onKeyDown = useCallback( ( e: React.KeyboardEvent ) => {
		controllerRef.current?.handleKeyDown( e.nativeEvent );
	}, [] );

	const onWheelNative = useCallback( ( e: WheelEvent ) => {
		controllerRef.current?.handleWheel( e );
	}, [] );

	return {
		handlers: {
			onPointerDown,
			onTouchStart,
			onKeyDown,
		},
		onWheelNative,
		isDragging,
		isZooming,
	};
}
