/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { StencilProps, NormalizedRect } from '../../../core/types';
import {
	DEFAULT_KEYBOARD_STEP,
	KEYBOARD_SHIFT_STEP_MULTIPLIER,
} from '../../../core/constants';
import {
	computeFreeResizeRect,
	computeLockedResizeRect,
	computeShiftLockedResizeRect,
	type HandlePosition,
	type CropBounds,
	type ResizeDragState,
	type ResizeDriverAxis,
} from '../../../core/stencil-math';
import { VISUALLY_HIDDEN_STYLE } from '../../visually-hidden-style';

/**
 * Corner handle positions only — used when aspect ratio is locked.
 * Ordered clockwise from top-left for logical tab order.
 */
const CORNER_POSITIONS: HandlePosition[] = [ 'nw', 'ne', 'se', 'sw' ];

/**
 * All handle positions rendered by the stencil.
 * Ordered clockwise from top-left for logical tab order.
 */
const ALL_POSITIONS: HandlePosition[] = [
	'nw',
	'n',
	'ne',
	'e',
	'se',
	's',
	'sw',
	'w',
];

/**
 * Get the translated aria-label for a resize handle position.
 *
 * @param pos The handle position identifier.
 * @return The translated label string.
 */
function getHandleLabel( pos: HandlePosition ): string {
	switch ( pos ) {
		case 'n':
			return __( 'Resize top edge' );
		case 's':
			return __( 'Resize bottom edge' );
		case 'e':
			return __( 'Resize right edge' );
		case 'w':
			return __( 'Resize left edge' );
		case 'nw':
			return __( 'Resize top-left corner' );
		case 'ne':
			return __( 'Resize top-right corner' );
		case 'sw':
			return __( 'Resize bottom-left corner' );
		case 'se':
			return __( 'Resize bottom-right corner' );
	}
}

/** Delay before keyboard resize triggers settle (ms). */
const KEYBOARD_SETTLE_DELAY = 500;

/**
 * Props for the RectangleStencil component.
 */
type RectangleStencilProps = StencilProps;

/**
 * A rectangular crop stencil with resize handles.
 *
 * In freeform mode, handles resize the crop area. Clicks inside the
 * crop pass through to the container for image panning. The crop
 * auto-centers after resize via SETTLE_CROP.
 *
 * @param props                    Component props implementing StencilProps.
 * @param props.cropRect           The crop rectangle in normalized coordinates.
 * @param props.containerSize      The container element dimensions in pixels.
 * @param props.imageSize          The rendered image dimensions in pixels.
 * @param props.onCropChange       Callback fired when the crop rect changes.
 * @param props.onResizeStart      Callback fired when a resize drag starts.
 * @param props.onResizeEnd        Callback fired when a resize drag ends (mouseup).
 * @param props.aspectRatio        Optional fixed aspect ratio (width / height).
 * @param props.freeformCrop       Whether resize handles are shown.
 * @param props.isResizeDisabled   Whether resize handles should ignore pointer and keyboard input.
 * @param props.stencilTransition  CSS transition string for settle animation.
 * @param props.cropBounds         Maximum crop rect bounds from camera (zoom/rotation-aware).
 * @param props.onEscape           Called when Escape is pressed on a resize handle.
 * @param props.minCropSize        Minimum crop rect dimension in normalized space, per axis.
 * @param props.snapCropRect       Optional post-processor for freeform resize output.
 * @param props.keyboardResizeStep Optional keyboard resize step in normalized space, per axis.
 * @return The rectangle stencil element.
 */
export function RectangleStencil( {
	cropRect,
	containerSize,
	imageSize,
	onCropChange,
	onResizeStart,
	onResizeEnd,
	aspectRatio,
	freeformCrop = false,
	isResizeDisabled = false,
	stencilTransition,
	cropBounds,
	onEscape,
	minCropSize,
	snapCropRect,
	keyboardResizeStep,
}: RectangleStencilProps ) {
	// Use cropBounds from the camera if available, otherwise default to [0,1].
	const boundsMinX = cropBounds?.minX ?? 0;
	const boundsMinY = cropBounds?.minY ?? 0;
	const boundsMaxX = cropBounds?.maxX ?? 1;
	const boundsMaxY = cropBounds?.maxY ?? 1;
	const bounds: CropBounds = useMemo(
		() => ( {
			minX: boundsMinX,
			minY: boundsMinY,
			maxX: boundsMaxX,
			maxY: boundsMaxY,
		} ),
		[ boundsMinX, boundsMinY, boundsMaxX, boundsMaxY ]
	);
	const keyboardSettleTimerRef = useRef< ReturnType< typeof setTimeout > >();
	const keyboardResizeActiveRef = useRef( false );
	const resizeHandleDescriptionId = useId();
	const hasLockedRatio = !! ( aspectRatio && aspectRatio > 0 );
	const activePointerResizeRef = useRef< {
		cancel: ( notifyResizeEnd?: boolean ) => void;
	} | null >( null );

	// Clear the pending keyboard settle timer on unmount so it can't
	// fire onResizeEnd / dispatch onto an unmounted parent.
	useEffect( () => {
		return () => {
			clearTimeout( keyboardSettleTimerRef.current );
			keyboardResizeActiveRef.current = false;
			activePointerResizeRef.current?.cancel( false );
		};
	}, [] );

	useEffect( () => {
		if ( isResizeDisabled ) {
			activePointerResizeRef.current?.cancel();
		}
	}, [ isResizeDisabled ] );

	// Latest callbacks for the drag listeners. The drag closure in
	// handlePointerDown reads from this ref so it always sees current
	// props without having to re-attach listeners mid-drag. Previously,
	// drag listeners lived in a useEffect that re-ran whenever `bounds`
	// changed (every SET_CROP_RECT dispatch), creating a window where
	// pointerup could be missed and the crop would never settle.
	const latestHandlersRef = useRef< {
		hasLockedRatio: boolean;
		computeLockedRect: (
			drag: ResizeDragState,
			clientX: number,
			clientY: number,
			driverAxis?: ResizeDriverAxis
		) => NormalizedRect;
		computeFreeRect: (
			drag: ResizeDragState,
			clientX: number,
			clientY: number
		) => NormalizedRect;
		computeShiftLockedRect: (
			drag: ResizeDragState,
			clientX: number,
			clientY: number
		) => NormalizedRect;
		onCropChange: ( rect: NormalizedRect ) => void;
		onResizeEnd?: () => void;
		snapCropRect?: (
			rect: NormalizedRect,
			handle: HandlePosition
		) => NormalizedRect;
	} | null >( null );

	// The normalized aspect ratio: the w/h ratio in normalized space that
	// produces the desired pixel aspect ratio.
	// pixelW = w * imageSize.width, pixelH = h * imageSize.height
	// pixelW / pixelH = aspectRatio  =>  w / h = aspectRatio * imageSize.height / imageSize.width
	const normalizedRatio = useMemo( () => {
		if ( ! hasLockedRatio || imageSize.width === 0 ) {
			return 0;
		}
		return ( aspectRatio * imageSize.height ) / imageSize.width;
	}, [ aspectRatio, hasLockedRatio, imageSize.width, imageSize.height ] );

	// Convert normalized crop rect to pixel bounds, accounting for the
	// image offset within the container.
	const offsetX = ( containerSize.width - imageSize.width ) / 2;
	const offsetY = ( containerSize.height - imageSize.height ) / 2;
	const left = offsetX + cropRect.x * imageSize.width;
	const top = offsetY + cropRect.y * imageSize.height;
	const width = cropRect.width * imageSize.width;
	const height = cropRect.height * imageSize.height;

	/**
	 * Start a resize drag on a handle. Registers pointer listeners
	 * synchronously so no events are missed between capture and the
	 * next React commit.
	 */
	const handlePointerDown = useCallback(
		( handle: HandlePosition, event: React.PointerEvent ) => {
			if (
				isResizeDisabled ||
				( event.pointerType === 'touch' && event.isPrimary === false )
			) {
				event.preventDefault();
				event.stopPropagation();
				return;
			}
			if ( event.button !== 0 ) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			// Blur any previously focused handle.
			const ownerDoc = event.currentTarget.ownerDocument;
			if ( ownerDoc.activeElement instanceof HTMLElement ) {
				ownerDoc.activeElement.blur();
			}
			// Capture pointer so drag works across iframe boundaries.
			const el = event.currentTarget as HTMLButtonElement;
			el.setPointerCapture( event.pointerId );

			const drag: ResizeDragState = {
				handle,
				startX: event.clientX,
				startY: event.clientY,
				startRect: { ...cropRect },
			};

			// RAF-throttle: stash the latest pointer position and
			// process it once per animation frame. Avoids dispatching
			// on every pointermove (which fires at much higher than
			// screen refresh rate) and matches the pan-drag path in
			// InteractionController.
			let rafId = 0;
			let latestX = event.clientX;
			let latestY = event.clientY;
			let latestShift = event.shiftKey;

			const onMove = ( e: Event ) => {
				const pe = e as PointerEvent;
				latestX = pe.clientX;
				latestY = pe.clientY;
				latestShift = pe.shiftKey;
				if ( rafId ) {
					return;
				}
				rafId = requestAnimationFrame( () => {
					rafId = 0;
					const h = latestHandlersRef.current;
					if ( ! h ) {
						return;
					}
					let newRect: NormalizedRect;
					if ( h.hasLockedRatio ) {
						newRect = h.computeLockedRect( drag, latestX, latestY );
					} else if ( latestShift ) {
						newRect = h.computeShiftLockedRect(
							drag,
							latestX,
							latestY
						);
					} else {
						newRect = h.computeFreeRect( drag, latestX, latestY );
						newRect =
							h.snapCropRect?.( newRect, drag.handle ) ?? newRect;
					}
					h.onCropChange( newRect );
				} );
			};

			// Guard against duplicate firing: pointerup and
			// lostpointercapture both fire on normal release.
			let ended = false;
			const endResize = (
				notifyResizeEnd = true,
				restoreFocus = true
			) => {
				if ( ended ) {
					return;
				}
				ended = true;
				if ( rafId ) {
					cancelAnimationFrame( rafId );
					rafId = 0;
				}
				el.removeEventListener( 'pointermove', onMove );
				el.removeEventListener( 'pointerup', onEnd );
				el.removeEventListener( 'lostpointercapture', onEnd );
				activePointerResizeRef.current = null;
				if ( notifyResizeEnd ) {
					latestHandlersRef.current?.onResizeEnd?.();
				}
				// Restore focus to the handle so arrow keys work
				// immediately after a mouse drag. Browsers suppress
				// :focus-visible after pointer interactions, so the
				// focus ring stays hidden until the user presses a key.
				if ( restoreFocus ) {
					el.focus( { preventScroll: true } );
				}
			};
			const cancelResize = ( notifyResizeEnd = true ) =>
				endResize( notifyResizeEnd, false );
			const onEnd = () => endResize();

			el.addEventListener( 'pointermove', onMove );
			el.addEventListener( 'pointerup', onEnd );
			el.addEventListener( 'lostpointercapture', onEnd );
			activePointerResizeRef.current = { cancel: cancelResize };

			onResizeStart?.( handle );
			// Cancel any pending keyboard settle so it can't fire onResizeEnd
			// mid-drag if the user switches from keyboard to pointer within
			// the settle window.
			clearTimeout( keyboardSettleTimerRef.current );
			keyboardResizeActiveRef.current = false;
		},
		[ cropRect, isResizeDisabled, onResizeStart ]
	);

	/**
	 * Compute the new crop rect for a free (no aspect ratio) resize.
	 * Delegates to the pure function in core/stencil-math.ts.
	 */
	const computeFreeRect = useCallback(
		(
			drag: ResizeDragState,
			clientX: number,
			clientY: number
		): NormalizedRect =>
			computeFreeResizeRect(
				drag,
				clientX,
				clientY,
				imageSize,
				bounds,
				minCropSize
			),
		[ imageSize, bounds, minCropSize ]
	);

	/**
	 * Compute the new crop rect for a locked-aspect-ratio corner resize.
	 * Delegates to the pure function in core/stencil-math.ts.
	 */
	const computeLockedRect = useCallback(
		(
			drag: ResizeDragState,
			clientX: number,
			clientY: number,
			driverAxis?: ResizeDriverAxis
		): NormalizedRect =>
			computeLockedResizeRect(
				drag,
				clientX,
				clientY,
				imageSize,
				bounds,
				normalizedRatio,
				minCropSize,
				driverAxis
			),
		[ imageSize, bounds, normalizedRatio, minCropSize ]
	);

	/**
	 * Compute the new crop rect when Shift is held during a freeform
	 * resize — preserves the start rect's aspect ratio.
	 */
	const computeShiftLockedRect = useCallback(
		(
			drag: ResizeDragState,
			clientX: number,
			clientY: number
		): NormalizedRect =>
			computeShiftLockedResizeRect(
				drag,
				clientX,
				clientY,
				imageSize,
				bounds,
				minCropSize
			),
		[ imageSize, bounds, minCropSize ]
	);

	latestHandlersRef.current = {
		hasLockedRatio,
		computeLockedRect,
		computeFreeRect,
		computeShiftLockedRect,
		onCropChange,
		onResizeEnd,
		snapCropRect,
	};

	/**
	 * Handle keyboard events on a resize handle.
	 * Arrow keys resize; Escape returns focus to the canvas.
	 * Shift multiplies the step size by 10 for coarser movement.
	 */
	const handleKeyDown = useCallback(
		( handle: HandlePosition, event: React.KeyboardEvent ) => {
			const key = event.key;

			if ( isResizeDisabled ) {
				return;
			}

			if ( key === 'Escape' ) {
				event.preventDefault();
				event.stopPropagation();
				onEscape?.();
				return;
			}

			if (
				key !== 'ArrowUp' &&
				key !== 'ArrowDown' &&
				key !== 'ArrowLeft' &&
				key !== 'ArrowRight'
			) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			if ( ! keyboardResizeActiveRef.current ) {
				keyboardResizeActiveRef.current = true;
				onResizeStart?.( handle );
			}

			const scheduleKeyboardResizeEnd = () => {
				clearTimeout( keyboardSettleTimerRef.current );
				keyboardSettleTimerRef.current = setTimeout( () => {
					keyboardResizeActiveRef.current = false;
					onResizeEnd?.();
				}, KEYBOARD_SETTLE_DELAY );
			};

			const stepMultiplier = event.shiftKey
				? KEYBOARD_SHIFT_STEP_MULTIPLIER
				: 1;
			const stepX = keyboardResizeStep?.width ?? DEFAULT_KEYBOARD_STEP;
			const stepY = keyboardResizeStep?.height ?? DEFAULT_KEYBOARD_STEP;
			const adjustedStepX = stepX * stepMultiplier;
			const adjustedStepY = stepY * stepMultiplier;

			// Determine the normalized delta from the arrow key.
			let dx = 0;
			let dy = 0;
			if ( key === 'ArrowLeft' ) {
				dx = -adjustedStepX;
			}
			if ( key === 'ArrowRight' ) {
				dx = adjustedStepX;
			}
			if ( key === 'ArrowUp' ) {
				dy = -adjustedStepY;
			}
			if ( key === 'ArrowDown' ) {
				dy = adjustedStepY;
			}
			const keyboardDriverAxis: ResizeDriverAxis =
				dx !== 0 ? 'width' : 'height';

			if ( hasLockedRatio ) {
				// For locked aspect ratio, synthesize a drag from the
				// current rect and apply the delta via computeLockedRect.
				const syntheticDrag: ResizeDragState = {
					handle,
					startX: 0,
					startY: 0,
					startRect: { ...cropRect },
				};
				const clientX = dx * imageSize.width;
				const clientY = dy * imageSize.height;
				onCropChange(
					computeLockedRect(
						syntheticDrag,
						clientX,
						clientY,
						keyboardDriverAxis
					)
				);
				scheduleKeyboardResizeEnd();
			} else {
				// For freeform resize, synthesize a drag via computeFreeRect.
				const syntheticDrag: ResizeDragState = {
					handle,
					startX: 0,
					startY: 0,
					startRect: { ...cropRect },
				};
				const clientX = dx * imageSize.width;
				const clientY = dy * imageSize.height;
				const rect = computeFreeRect( syntheticDrag, clientX, clientY );
				onCropChange( snapCropRect?.( rect, handle ) ?? rect );
				scheduleKeyboardResizeEnd();
			}
		},
		[
			cropRect,
			hasLockedRatio,
			imageSize.width,
			imageSize.height,
			computeLockedRect,
			computeFreeRect,
			onCropChange,
			onResizeStart,
			onResizeEnd,
			onEscape,
			keyboardResizeStep,
			snapCropRect,
			isResizeDisabled,
		]
	);

	if ( containerSize.width === 0 || containerSize.height === 0 ) {
		return null;
	}

	const handles = hasLockedRatio ? CORNER_POSITIONS : ALL_POSITIONS;

	return (
		<div
			className="wp-media-editor-image-editor__stencil"
			data-testid="cropper-stencil"
			style={ {
				left,
				top,
				width,
				height,
				transition: stencilTransition,
			} }
		>
			{ freeformCrop && (
				<div
					id={ resizeHandleDescriptionId }
					style={ VISUALLY_HIDDEN_STYLE }
				>
					{ __(
						'Use arrow keys to resize the crop area. Hold Shift for larger steps.'
					) }
				</div>
			) }
			{ /* The crop rectangle border. pointer-events: none is set in
				   CSS so clicks pass through to the container for panning. */ }
			<div
				className="wp-media-editor-image-editor__stencil-rect"
				style={ {
					width: '100%',
					height: '100%',
					top: 0,
					left: 0,
				} }
			/>
			{ /* Resize handles — only in freeform mode.
				   Semantics: role="button" with aria-label describing
				   which edge/corner. Arrow keys resize (onKeyDown).
				   role="slider" would be more precise but requires
				   per-handle aria-valuemin/max/now which don't map
				   cleanly to a 2D crop rect. */ }
			{ freeformCrop &&
				handles.map( ( pos ) => (
					<button
						key={ pos }
						type="button"
						className={ `wp-media-editor-image-editor__handle wp-media-editor-image-editor__handle--${ pos }` }
						onPointerDown={ ( event ) =>
							handlePointerDown( pos, event )
						}
						onTouchStart={ ( event ) => {
							if ( event.touches.length < 2 ) {
								event.stopPropagation();
							}
						} }
						onKeyDown={ ( event ) => handleKeyDown( pos, event ) }
						aria-label={ getHandleLabel( pos ) }
						aria-describedby={ resizeHandleDescriptionId }
					/>
				) ) }
		</div>
	);
}
