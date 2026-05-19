/**
 * Internal dependencies
 */
import type { CropperState, NormalizedPoint, Size } from './types';
import {
	DEFAULT_KEYBOARD_STEP,
	DEFAULT_WHEEL_ZOOM_SPEED,
	KEYBOARD_SHIFT_STEP_MULTIPLIER,
	MIN_ZOOM,
	MAX_ZOOM,
} from './constants';
import { restrictPanZoom } from './containment';

/** Time window for detecting a double-tap gesture (ms). */
const DOUBLE_TAP_TIME = 300;
/** Max distance between taps to count as a double-tap (px). */
const DOUBLE_TAP_DISTANCE = 30;
/** Duration of the zoom animation state (ms). */
const ZOOM_ANIMATION_DURATION = 200;

/**
 * Get the natural image dimensions from cropper state, falling back to 1x1.
 *
 * @param state The current cropper state.
 * @return The image dimensions.
 */
function getImageSizeFromState( state: CropperState ): {
	width: number;
	height: number;
} {
	return state.image
		? { width: state.image.naturalWidth, height: state.image.naturalHeight }
		: { width: 1, height: 1 };
}

/**
 * Get the distance between two touch points.
 *
 * @param t1 The first touch.
 * @param t2 The second touch.
 * @return The pixel distance between the two touches.
 */
function getTouchDistance( t1: Touch, t2: Touch ): number {
	const dx = t1.clientX - t2.clientX;
	const dy = t1.clientY - t2.clientY;
	return Math.sqrt( dx * dx + dy * dy );
}

/**
 * Status reported by the interaction controller when drag/zoom state changes.
 */
export interface InteractionStatus {
	/** Whether a drag (pan) interaction is in progress. */
	isDragging: boolean;
	/** Whether a double-tap zoom animation is in progress. */
	isZooming: boolean;
}

/**
 * State updates the interaction controller can request from its host UI.
 */
export interface CropperInteractionActions {
	/** Set the image pan offset in normalized coordinates. */
	setPan: ( pan: NormalizedPoint ) => void;
	/**
	 * Set the zoom level. Cursorless surfaces (slider, keyboard `+`/`-`)
	 * rely on this anchoring at the crop center; pointer-driven zoom
	 * paths use `setZoomAtPoint` with an explicit focal point instead.
	 */
	setZoom: ( zoom: number ) => void;
	/** Set zoom and pan together for focal-point zoom. */
	setZoomAtPoint: ( zoom: number, pan: NormalizedPoint ) => void;
	/** Snap rotate by 90 degrees. */
	snapRotate90: ( direction: 1 | -1 ) => void;
	/** Toggle flip on the given axis. */
	toggleFlip?: ( direction: 'horizontal' | 'vertical' ) => void;
}

/**
 * Options for creating an InteractionController.
 *
 * Scalar options (minZoom, maxZoom, etc.) are read lazily on each
 * interaction, so changes to the options object take effect immediately
 * without recreating the controller.
 */
export interface InteractionControllerOptions {
	/** Returns the current cropper state. Called on every interaction. */
	getState: () => CropperState;
	/** State updates the interaction controller can request from its host UI. */
	actions: CropperInteractionActions;
	/** Returns the container dimensions in pixels. */
	getContainerSize: () => Size;
	/** Returns the rendered image dimensions in pixels, if available. */
	getImageSize: () => Size | undefined;
	/** Minimum zoom level. Defaults to MIN_ZOOM. Read lazily. */
	minZoom?: number;
	/** Maximum zoom level. Defaults to MAX_ZOOM. Read lazily. */
	maxZoom?: number;
	/** Zoom speed multiplier for wheel events. Defaults to 0.0025. Read lazily. */
	zoomSpeed?: number;
	/**
	 * Pan step size in normalized coords for keyboard events.
	 * Defaults to 0.01. Read lazily. Shift multiplies it by 10.
	 */
	keyboardStep?: number;
	/** Zoom level for double-tap zoom. Defaults to 2. Read lazily. */
	doubleTapZoom?: number;
	/** Fires when a continuous gesture begins (pan drag, pinch zoom). */
	onGestureStart?: () => void;
	/** Fires when a continuous gesture ends (pointer release). */
	onGestureEnd?: () => void;
	/** Called when isDragging or isZooming changes. */
	onStatusChange?: ( status: InteractionStatus ) => void;
}

/**
 * Framework-agnostic imperative controller for image cropper interactions.
 *
 * Handles mouse, touch, and keyboard event processing for pan, zoom,
 * and crop manipulation. Uses requestAnimationFrame for drag/pinch
 * updates to avoid layout thrashing.
 *
 * The controller does not register DOM event listeners itself — that is the
 * responsibility of the UI layer (React hook, Vue directive, or vanilla JS).
 * Instead it exposes `handlePointerDown`, `handleWheel`, `handleTouchStart`,
 * and `handleKeyDown` methods that the UI layer calls with native DOM events.
 *
 * Scalar options (minZoom, maxZoom, zoomSpeed, keyboardStep, doubleTapZoom)
 * are read lazily from `this.options` on each interaction, so the UI layer
 * can update them without recreating the controller.
 *
 * Call `destroy()` to clean up timers and pending animation frames.
 */
export class InteractionController {
	private readonly options: InteractionControllerOptions;

	/** Current drag/zoom status. */
	private isDragging = false;
	private isZooming = false;

	/** Active drag state during pointer interactions. */
	private drag: {
		startX: number;
		startY: number;
		startPanX: number;
		startPanY: number;
	} | null = null;

	/** Active touch state during touch interactions. */
	private touch: {
		/** Finger distance at pinch start (0 until pinch detected). */
		startDistance: number;
		/** Zoom level when pinch was detected. */
		startZoom: number;
		/** First touch X/Y (for single-finger pan delta). */
		lastTouchX: number;
		lastTouchY: number;
		/** Pan when gesture started. */
		startPanX: number;
		startPanY: number;
		/** Container rect snapshot for focal-point math. */
		containerRect?: DOMRect;
		/** Midpoint of two fingers when pinch was detected. */
		startMidX: number;
		startMidY: number;
		/** Whether pinch was ever detected during this gesture. */
		didPinch: boolean;
		/** Whether any dispatch has occurred (prevents dispatching before first move). */
		moved: boolean;
	} | null = null;

	/** Cleanup function for active touch listeners on document. */
	private touchCleanup: ( () => void ) | null = null;

	/**
	 * Cleanup function for active pointer-drag listeners on the
	 * captured element. Set while a pointer drag is in progress so
	 * `destroy()` can tear the drag down cleanly if the consumer
	 * unmounts mid-drag. Cleared on pointerup/lostpointercapture.
	 */
	private pointerCleanup: ( () => void ) | null = null;

	/** Last tap info for double-tap detection. */
	private lastTap: {
		time: number;
		x: number;
		y: number;
	} | null = null;

	/** Timer for the zoom animation state (double-tap). */
	private zoomTimer: ReturnType< typeof setTimeout > | undefined;

	/** Timer for wheel gesture debounce. */
	private wheelGestureTimer: ReturnType< typeof setTimeout > | undefined;

	/** Whether a wheel gesture is currently active. */
	private wheelGestureActive = false;

	/** Current requestAnimationFrame ID. */
	private rafId = 0;

	constructor( options: InteractionControllerOptions ) {
		this.options = options;
	}

	/** Read minZoom lazily so option changes take effect immediately. */
	private get minZoom(): number {
		return this.options.minZoom ?? MIN_ZOOM;
	}

	/** Read maxZoom lazily so option changes take effect immediately. */
	private get maxZoom(): number {
		return this.options.maxZoom ?? MAX_ZOOM;
	}

	/** Read zoomSpeed lazily so option changes take effect immediately. */
	private get zoomSpeed(): number {
		return this.options.zoomSpeed ?? DEFAULT_WHEEL_ZOOM_SPEED;
	}

	/** Read keyboardStep lazily so option changes take effect immediately. */
	private get keyboardStep(): number {
		return this.options.keyboardStep ?? DEFAULT_KEYBOARD_STEP;
	}

	/**
	 * Get the keyboard pan step, including modifier-based coarse movement.
	 *
	 * @param event The native KeyboardEvent.
	 * @return The normalized pan step.
	 */
	private getKeyboardStep( event: KeyboardEvent ): number {
		return event.shiftKey
			? this.keyboardStep * KEYBOARD_SHIFT_STEP_MULTIPLIER
			: this.keyboardStep;
	}

	/** Read doubleTapZoom lazily so option changes take effect immediately. */
	private get doubleTapZoom(): number {
		return this.options.doubleTapZoom ?? 2;
	}

	/**
	 * Update the drag/zoom status and notify via callback if changed.
	 *
	 * @param update Partial status with isDragging and/or isZooming.
	 */
	private setStatus(
		update: Partial< { isDragging: boolean; isZooming: boolean } >
	): void {
		let changed = false;
		if (
			update.isDragging !== undefined &&
			update.isDragging !== this.isDragging
		) {
			this.isDragging = update.isDragging;
			changed = true;
		}
		if (
			update.isZooming !== undefined &&
			update.isZooming !== this.isZooming
		) {
			this.isZooming = update.isZooming;
			changed = true;
		}
		if ( changed ) {
			this.options.onStatusChange?.( {
				isDragging: this.isDragging,
				isZooming: this.isZooming,
			} );
		}
	}

	/**
	 * Handle a pointer-down event on the container element.
	 *
	 * Initiates a drag (pan) interaction. Captures the pointer on the
	 * provided element and registers pointermove/pointerup/lostpointercapture
	 * listeners for the duration of the drag.
	 *
	 * @param e  The native PointerEvent.
	 * @param el The DOM element to capture the pointer on.
	 */
	handlePointerDown( e: PointerEvent, el: HTMLElement ): void {
		// Only handle primary button (left click / first touch).
		if ( e.button !== 0 ) {
			return;
		}
		e.preventDefault();

		// Blur any focused handle so its focus ring doesn't linger,
		// but leave the canvas itself alone so keyboard control works after drag.
		const ownerDoc = el.ownerDocument;
		if (
			ownerDoc?.activeElement instanceof HTMLElement &&
			ownerDoc.activeElement !== el
		) {
			ownerDoc.activeElement.blur();
		}

		el.focus();

		// Capture pointer so drag works across iframe boundaries.
		el.setPointerCapture( e.pointerId );

		this.setStatus( { isDragging: true } );
		this.options.onGestureStart?.();

		const currentState = this.options.getState();
		this.drag = {
			startX: e.clientX,
			startY: e.clientY,
			startPanX: currentState.pan.x,
			startPanY: currentState.pan.y,
		};

		const onPointerMove = ( moveEvent: Event ) => {
			const drag = this.drag;
			if ( ! drag ) {
				return;
			}
			const pe = moveEvent as PointerEvent;

			cancelAnimationFrame( this.rafId );
			this.rafId = requestAnimationFrame( () => {
				const s = this.options.getState();
				const imgSize = this.options.getImageSize();
				const containerSize = this.options.getContainerSize();
				const panSize = imgSize ?? containerSize;
				const deltaX =
					panSize.width > 0
						? ( pe.clientX - drag.startX ) / panSize.width
						: 0;
				const deltaY =
					panSize.height > 0
						? ( pe.clientY - drag.startY ) / panSize.height
						: 0;

				const { pan: newCrop } = restrictPanZoom(
					{
						...s,
						pan: {
							x: drag.startPanX + deltaX,
							y: drag.startPanY + deltaY,
						},
					},
					getImageSizeFromState( s ),
					s.cropRect
				);

				this.options.actions.setPan( newCrop );
			} );
		};

		const removeListeners = () => {
			el.removeEventListener( 'pointermove', onPointerMove );
			el.removeEventListener( 'pointerup', onPointerUp );
			el.removeEventListener( 'lostpointercapture', onPointerUp );
		};

		const onPointerUp = () => {
			this.setStatus( { isDragging: false } );
			this.options.onGestureEnd?.();
			this.drag = null;
			cancelAnimationFrame( this.rafId );
			removeListeners();
			this.pointerCleanup = null;
		};

		el.addEventListener( 'pointermove', onPointerMove );
		el.addEventListener( 'pointerup', onPointerUp );
		el.addEventListener( 'lostpointercapture', onPointerUp );
		// Expose cleanup to destroy() in case the consumer unmounts
		// mid-drag. The pending rAF is cancelled in destroy().
		this.pointerCleanup = removeListeners;
	}

	/**
	 * Handle a wheel event on the container element.
	 *
	 * Implements focal-point zoom: the point under the cursor stays
	 * stationary on screen while the zoom level changes.
	 *
	 * Must be registered with `{ passive: false }` to allow preventDefault.
	 *
	 * @param e The native WheelEvent.
	 */
	handleWheel( e: WheelEvent ): void {
		e.preventDefault();

		if ( this.drag ) {
			return;
		}

		// Debounced gesture boundaries for wheel zoom.
		// Start on first wheel event, end after 300ms of no events.
		if ( ! this.wheelGestureActive ) {
			this.wheelGestureActive = true;
			this.options.onGestureStart?.();
		}
		clearTimeout( this.wheelGestureTimer );
		this.wheelGestureTimer = setTimeout( () => {
			this.wheelGestureActive = false;
			this.options.onGestureEnd?.();
		}, DOUBLE_TAP_TIME );

		const s = this.options.getState();
		const delta = -e.deltaY * this.zoomSpeed;
		const newZoom = Math.min(
			this.maxZoom,
			Math.max( this.minZoom, s.zoom + delta )
		);

		if ( newZoom === s.zoom ) {
			return;
		}

		// Focal-point zoom: keep the point under the cursor stationary.
		const containerSize = this.options.getContainerSize();
		const imgSize = this.options.getImageSize();
		const visSize = imgSize ?? containerSize;
		const target = e.currentTarget;
		const rect =
			target instanceof Element
				? target.getBoundingClientRect()
				: undefined;
		if ( visSize.width > 0 && visSize.height > 0 && rect ) {
			const fx = e.clientX - rect.left - containerSize.width / 2;
			const fy = e.clientY - rect.top - containerSize.height / 2;

			const zoomRatio = 1 - newZoom / s.zoom;
			const focalNormX = fx / visSize.width;
			const focalNormY = fy / visSize.height;
			const newCropX = s.pan.x + ( focalNormX - s.pan.x ) * zoomRatio;
			const newCropY = s.pan.y + ( focalNormY - s.pan.y ) * zoomRatio;

			const { pan: clampedCrop } = restrictPanZoom(
				{ ...s, zoom: newZoom, pan: { x: newCropX, y: newCropY } },
				getImageSizeFromState( s ),
				s.cropRect
			);
			this.options.actions.setZoomAtPoint( newZoom, clampedCrop );
		} else {
			this.options.actions.setZoom( newZoom );
		}
	}

	/**
	 * Handle a touch-start event on the container element.
	 *
	 * Supports single-finger pan, two-finger pinch zoom, and
	 * double-tap to toggle between fit and 2x zoom. Registers
	 * touchmove/touchend/touchcancel on the provided document for the
	 * duration of the gesture.
	 *
	 * @param e             The native TouchEvent.
	 * @param containerRect The bounding rect of the container element.
	 * @param doc           The document to register move/end listeners on.
	 *                      Defaults to globalThis.document. Pass the iframe's
	 *                      contentDocument when running inside an iframe.
	 */
	handleTouchStart(
		e: TouchEvent,
		containerRect: DOMRect,
		doc: Document = document
	): void {
		// Second finger arriving during an existing gesture — snapshot
		// pinch start values. handleTouchMove will detect 2 touches and
		// handle pinch automatically.
		if ( this.touch && e.touches.length === 2 ) {
			const s = this.options.getState();
			const distance = getTouchDistance( e.touches[ 0 ], e.touches[ 1 ] );
			const midX =
				( e.touches[ 0 ].clientX + e.touches[ 1 ].clientX ) / 2;
			const midY =
				( e.touches[ 0 ].clientY + e.touches[ 1 ].clientY ) / 2;
			this.touch.didPinch = true;
			this.touch.startDistance = distance;
			this.touch.startZoom = s.zoom;
			this.touch.startPanX = s.pan.x;
			this.touch.startPanY = s.pan.y;
			this.touch.startMidX = midX;
			this.touch.startMidY = midY;
			this.touch.containerRect = containerRect;
			this.setStatus( { isDragging: false } );
			return;
		}

		if ( e.touches.length === 1 ) {
			const tapX = e.touches[ 0 ].clientX;
			const tapY = e.touches[ 0 ].clientY;
			if ( this.tryDoubleTap( e, tapX, tapY, containerRect ) ) {
				return;
			}

			const currentState = this.options.getState();

			// Record touch state. Don't decide pan vs pinch yet —
			// that happens in handleTouchMove based on touches.length.
			this.touch = {
				startDistance: 0,
				startZoom: currentState.zoom,
				lastTouchX: e.touches[ 0 ].clientX,
				lastTouchY: e.touches[ 0 ].clientY,
				startPanX: currentState.pan.x,
				startPanY: currentState.pan.y,
				containerRect,
				startMidX: 0,
				startMidY: 0,
				didPinch: false,
				moved: false,
			};
			this.options.onGestureStart?.();
		} else if ( e.touches.length === 2 ) {
			// Both fingers landed simultaneously (rare but possible).
			const currentState = this.options.getState();
			const distance = getTouchDistance( e.touches[ 0 ], e.touches[ 1 ] );
			const midX =
				( e.touches[ 0 ].clientX + e.touches[ 1 ].clientX ) / 2;
			const midY =
				( e.touches[ 0 ].clientY + e.touches[ 1 ].clientY ) / 2;
			this.touch = {
				startDistance: distance,
				startZoom: currentState.zoom,
				lastTouchX: 0,
				lastTouchY: 0,
				startPanX: currentState.pan.x,
				startPanY: currentState.pan.y,
				containerRect,
				startMidX: midX,
				startMidY: midY,
				didPinch: true,
				moved: false,
			};
			this.options.onGestureStart?.();
		}

		const onTouchEnd = () => {
			this.touch = null;
			this.touchCleanup = null;
			cancelAnimationFrame( this.rafId );
			doc.removeEventListener( 'touchmove', this.handleTouchMove );
			doc.removeEventListener( 'touchend', onTouchEnd );
			doc.removeEventListener( 'touchcancel', onTouchEnd );
			this.setStatus( { isDragging: false } );
			this.options.onGestureEnd?.();
		};

		// Clean up any previous touch listeners before registering new ones.
		this.touchCleanup?.();

		doc.addEventListener( 'touchmove', this.handleTouchMove, {
			passive: false,
		} );
		doc.addEventListener( 'touchend', onTouchEnd );
		doc.addEventListener( 'touchcancel', onTouchEnd );

		this.touchCleanup = onTouchEnd;
	}

	// Handle a touchmove event during an active touch gesture. Decides pinch
	// vs. pan based on current `moveEvent.touches.length`, so the gesture
	// can transition between modes without timing sensitivity (e.g. fingers
	// landing 0ms vs 200ms apart). Arrow-property binding so `this` stays
	// attached when used as an event listener.
	private handleTouchMove = ( moveEvent: TouchEvent ): void => {
		const touch = this.touch;
		if ( ! touch ) {
			return;
		}

		cancelAnimationFrame( this.rafId );
		this.rafId = requestAnimationFrame( () => {
			const s = this.options.getState();

			if ( moveEvent.touches.length === 2 ) {
				// Two fingers → always pinch, regardless of how gesture
				// started. Initialize pinch state on first 2-finger move.
				if ( ! touch.didPinch ) {
					touch.didPinch = true;
					touch.startDistance = getTouchDistance(
						moveEvent.touches[ 0 ],
						moveEvent.touches[ 1 ]
					);
					touch.startZoom = s.zoom;
					touch.startPanX = s.pan.x;
					touch.startPanY = s.pan.y;
					touch.startMidX =
						( moveEvent.touches[ 0 ].clientX +
							moveEvent.touches[ 1 ].clientX ) /
						2;
					touch.startMidY =
						( moveEvent.touches[ 0 ].clientY +
							moveEvent.touches[ 1 ].clientY ) /
						2;
					this.setStatus( { isDragging: false } );
					return;
				}
				const latestContainerSize = this.options.getContainerSize();
				const latestImageSize = this.options.getImageSize();

				// Pinch zoom with focal point at finger midpoint,
				// plus simultaneous pan from midpoint drift.
				const t0 = moveEvent.touches[ 0 ];
				const t1 = moveEvent.touches[ 1 ];
				const currentDistance = getTouchDistance( t0, t1 );
				const ratio = currentDistance / touch.startDistance;
				const newZoom = Math.min(
					this.maxZoom,
					Math.max( this.minZoom, touch.startZoom * ratio )
				);

				const visSize = latestImageSize ?? latestContainerSize;
				const rect = touch.containerRect;
				if ( visSize.width > 0 && visSize.height > 0 && rect ) {
					// Current midpoint.
					const mx =
						( t0.clientX + t1.clientX ) / 2 -
						rect.left -
						latestContainerSize.width / 2;
					const my =
						( t0.clientY + t1.clientY ) / 2 -
						rect.top -
						latestContainerSize.height / 2;

					// Pan from midpoint drift (fingers moving together).
					const startMx =
						touch.startMidX -
						rect.left -
						latestContainerSize.width / 2;
					const startMy =
						touch.startMidY -
						rect.top -
						latestContainerSize.height / 2;
					const panDx =
						visSize.width > 0
							? ( mx - startMx ) / visSize.width
							: 0;
					const panDy =
						visSize.height > 0
							? ( my - startMy ) / visSize.height
							: 0;

					// Focal-point zoom correction.
					const zoomRatio = s.zoom !== 0 ? 1 - newZoom / s.zoom : 0;
					const focalNormX = mx / visSize.width;
					const focalNormY = my / visSize.height;
					const zoomCropX =
						s.pan.x + ( focalNormX - s.pan.x ) * zoomRatio;
					const zoomCropY =
						s.pan.y + ( focalNormY - s.pan.y ) * zoomRatio;

					// Combined: pan drift + zoom correction.
					const newCropX =
						touch.startPanX + panDx + ( zoomCropX - s.pan.x );
					const newCropY =
						touch.startPanY + panDy + ( zoomCropY - s.pan.y );

					const { pan: clampedCrop } = restrictPanZoom(
						{
							...s,
							zoom: newZoom,
							pan: { x: newCropX, y: newCropY },
						},
						getImageSizeFromState( s ),
						s.cropRect
					);
					this.options.actions.setZoomAtPoint( newZoom, clampedCrop );
				} else if ( newZoom !== s.zoom ) {
					this.options.actions.setZoom( newZoom );
				}
			} else if ( moveEvent.touches.length === 1 && ! touch.didPinch ) {
				// One finger and no pinch ever detected → pan.
				// If fingers went 2→1 (didPinch is true), we do NOT
				// switch to pan — avoids accidental pan after releasing
				// one finger from a pinch.
				if ( ! touch.moved ) {
					touch.moved = true;
					this.setStatus( { isDragging: true } );
				}
				const panImageSize = this.options.getImageSize();
				const panContainerSize = this.options.getContainerSize();
				const panSize = panImageSize ?? panContainerSize;
				const deltaX =
					panSize.width > 0
						? ( moveEvent.touches[ 0 ].clientX -
								touch.lastTouchX ) /
						  panSize.width
						: 0;
				const deltaY =
					panSize.height > 0
						? ( moveEvent.touches[ 0 ].clientY -
								touch.lastTouchY ) /
						  panSize.height
						: 0;

				const { pan: newCrop } = restrictPanZoom(
					{
						...s,
						pan: {
							x: touch.startPanX + deltaX,
							y: touch.startPanY + deltaY,
						},
					},
					getImageSizeFromState( s ),
					s.cropRect
				);

				this.options.actions.setPan( newCrop );
			}
		} );
	};

	// Handle double-tap-to-toggle-zoom. On a second tap within the configured
	// time/distance threshold, toggles zoom between `minZoom` and
	// `doubleTapZoom` around the tap point and dispatches. Returns `true` if
	// the tap was handled as a double-tap (caller should early-return),
	// `false` otherwise (caller proceeds with normal single-tap handling).
	// Either way, records the tap for next time.
	private tryDoubleTap(
		e: TouchEvent,
		tapX: number,
		tapY: number,
		containerRect: DOMRect
	): boolean {
		const now = Date.now();
		const lastTap = this.lastTap;
		if ( ! lastTap ) {
			this.lastTap = { time: now, x: tapX, y: tapY };
			return false;
		}
		const timeDelta = now - lastTap.time;
		const distDelta = Math.sqrt(
			( tapX - lastTap.x ) ** 2 + ( tapY - lastTap.y ) ** 2
		);
		const isDoubleTap =
			timeDelta < DOUBLE_TAP_TIME && distDelta < DOUBLE_TAP_DISTANCE;
		if ( ! isDoubleTap ) {
			this.lastTap = { time: now, x: tapX, y: tapY };
			return false;
		}

		// It's a double-tap — suppress browser zoom.
		e.preventDefault();
		this.lastTap = null;

		const currentState = this.options.getState();
		const containerSize = this.options.getContainerSize();
		const imgSize = this.options.getImageSize();

		// Toggle: if past halfway to doubleTapZoom, go back to 1x.
		const targetZoom =
			currentState.zoom > ( this.minZoom + this.doubleTapZoom ) / 2
				? this.minZoom
				: this.doubleTapZoom;
		const visSize = imgSize ?? containerSize;

		// Enable zoom animation before dispatching.
		this.setStatus( { isZooming: true } );
		clearTimeout( this.zoomTimer );
		this.zoomTimer = setTimeout( () => {
			this.setStatus( { isZooming: false } );
		}, ZOOM_ANIMATION_DURATION );

		// Double-tap bypasses the normal handleTouchStart gesture path so
		// onGestureStart/End are never called — fire them here so undo
		// receives a proper boundary around this discrete zoom action.
		this.options.onGestureStart?.();

		if ( visSize.width > 0 && visSize.height > 0 ) {
			const fx = tapX - containerRect.left - containerSize.width / 2;
			const fy = tapY - containerRect.top - containerSize.height / 2;

			const zoomRatio = 1 - targetZoom / currentState.zoom;
			const focalNormX = fx / visSize.width;
			const focalNormY = fy / visSize.height;
			const newCropX =
				currentState.pan.x +
				( focalNormX - currentState.pan.x ) * zoomRatio;
			const newCropY =
				currentState.pan.y +
				( focalNormY - currentState.pan.y ) * zoomRatio;

			const { pan: clampedCrop } = restrictPanZoom(
				{
					...currentState,
					zoom: targetZoom,
					pan: { x: newCropX, y: newCropY },
				},
				getImageSizeFromState( currentState ),
				currentState.cropRect
			);
			this.options.actions.setZoomAtPoint( targetZoom, clampedCrop );
		} else {
			this.options.actions.setZoom( targetZoom );
		}

		this.options.onGestureEnd?.();
		return true;
	}

	/**
	 * Handle a keydown event on the container element.
	 *
	 * Supports arrow keys for panning, +/- for zoom, and r/R for rotation.
	 *
	 * @param e The native KeyboardEvent.
	 */
	handleKeyDown( e: KeyboardEvent ): void {
		const currentState = this.options.getState();

		switch ( e.key ) {
			case 'ArrowUp': {
				e.preventDefault();
				const keyboardStep = this.getKeyboardStep( e );
				const { pan: newCrop } = restrictPanZoom(
					{
						...currentState,
						pan: {
							x: currentState.pan.x,
							y: currentState.pan.y + keyboardStep,
						},
					},
					getImageSizeFromState( currentState ),
					currentState.cropRect
				);
				this.options.actions.setPan( newCrop );
				break;
			}
			case 'ArrowDown': {
				e.preventDefault();
				const keyboardStep = this.getKeyboardStep( e );
				const { pan: newCrop } = restrictPanZoom(
					{
						...currentState,
						pan: {
							x: currentState.pan.x,
							y: currentState.pan.y - keyboardStep,
						},
					},
					getImageSizeFromState( currentState ),
					currentState.cropRect
				);
				this.options.actions.setPan( newCrop );
				break;
			}
			case 'ArrowLeft': {
				e.preventDefault();
				const keyboardStep = this.getKeyboardStep( e );
				const { pan: newCrop } = restrictPanZoom(
					{
						...currentState,
						pan: {
							x: currentState.pan.x + keyboardStep,
							y: currentState.pan.y,
						},
					},
					getImageSizeFromState( currentState ),
					currentState.cropRect
				);
				this.options.actions.setPan( newCrop );
				break;
			}
			case 'ArrowRight': {
				e.preventDefault();
				const keyboardStep = this.getKeyboardStep( e );
				const { pan: newCrop } = restrictPanZoom(
					{
						...currentState,
						pan: {
							x: currentState.pan.x - keyboardStep,
							y: currentState.pan.y,
						},
					},
					getImageSizeFromState( currentState ),
					currentState.cropRect
				);
				this.options.actions.setPan( newCrop );
				break;
			}
			case '+':
			case '=': {
				e.preventDefault();
				const newZoom = Math.min(
					this.maxZoom,
					Math.max( this.minZoom, currentState.zoom + 0.5 )
				);
				this.options.actions.setZoom( newZoom );
				break;
			}
			case '-':
			case '_': {
				e.preventDefault();
				const newZoom = Math.min(
					this.maxZoom,
					Math.max( this.minZoom, currentState.zoom - 0.5 )
				);
				this.options.actions.setZoom( newZoom );
				break;
			}
			case 'r':
			case 'R': {
				if ( e.metaKey || e.ctrlKey || e.altKey ) {
					break;
				}
				e.preventDefault();
				this.options.actions.snapRotate90( e.shiftKey ? -1 : 1 );
				break;
			}
			case 'h':
			case 'H': {
				if ( e.metaKey || e.ctrlKey || e.altKey || e.shiftKey ) {
					break;
				}
				e.preventDefault();
				this.options.actions.toggleFlip?.( 'horizontal' );
				break;
			}
			case 'v':
			case 'V': {
				if ( e.metaKey || e.ctrlKey || e.altKey || e.shiftKey ) {
					break;
				}
				e.preventDefault();
				this.options.actions.toggleFlip?.( 'vertical' );
				break;
			}
		}
	}

	/**
	 * Clean up all timers, animation frames, and active touch listeners.
	 *
	 * Must be called when the controller is no longer needed (e.g., on
	 * component unmount or element removal).
	 */
	destroy(): void {
		cancelAnimationFrame( this.rafId );
		clearTimeout( this.zoomTimer );
		clearTimeout( this.wheelGestureTimer );
		this.touchCleanup?.();
		this.touchCleanup = null;
		this.pointerCleanup?.();
		this.pointerCleanup = null;
		this.drag = null;
		this.touch = null;
		this.lastTap = null;
	}
}
