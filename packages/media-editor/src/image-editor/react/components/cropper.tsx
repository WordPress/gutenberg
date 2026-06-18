/**
 * External dependencies
 */

import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useState,
	useCallback,
	useMemo,
	useRef,
	useEffect,
	useLayoutEffect,
	useId,
	forwardRef,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	CropperState,
	HandlePosition,
	StencilProps,
	Size,
	NormalizedRect,
} from '../../core/types';
import type { CropperController } from '../hooks/use-cropper-reducer';
import { getImageFit, getRotatedBBox, getViewScale } from '../../core/camera';
import { getImageCropBounds, getMinZoom } from '../../core/containment';
import {
	MAX_VIEW_SCALE,
	PIXEL_SNAP_DISPLAY_SCALE,
	SETTLE_TARGET_CANVAS_FILL,
} from '../../core/constants';
import { computeInscribedRect } from '../../core/crop-rect';
import { getMinCropPixels } from '../../core/stencil-math';
import { useInteraction } from '../hooks/use-interaction';
import { useTransformStyle } from '../hooks/use-transform-style';
import { useAriaAnnouncer } from '../hooks/use-aria-announcer';
import { RectangleStencil } from './stencils/rectangle-stencil';
import { DimmingOverlay } from './overlays/dimming-overlay';
import { GridOverlay } from './overlays/grid-overlay';
import { DimensionsOverlay } from './overlays/dimensions-overlay';
import {
	getSourceRegion,
	snapCropRectToSourcePixelGrid,
	snapCropRectToSourcePixels,
} from '../../core/source-region';
import { ViewportProvider, useViewport } from './viewport-provider';
import { VISUALLY_HIDDEN_STYLE } from '../visually-hidden-style';

/** Threshold for comparing normalized crop rect values. */
const CROP_RECT_EPSILON = 1e-6;
/** Threshold for deciding whether rotation is at a 90-degree stop. */
const CARDINAL_ROTATION_EPSILON = 1e-6;

/**
 * Props for the Cropper component.
 */
export interface CropperProps {
	/** Image source URL. */
	src: string;
	/** The cropper controller from `useCropperReducer` or a composite store. */
	controller: CropperController;
	/** Stencil component for the crop area. Defaults to RectangleStencil. */
	stencil?: React.ComponentType< StencilProps >;
	/** Show the rule-of-thirds grid overlay, or only during interactions. */
	showGrid?: boolean | 'interactive';
	/** Whether external placement activity should keep the grid visible. */
	isPlacementActive?: boolean;
	/** Show the dimming overlay outside the crop area. */
	showDimming?: boolean;
	/** Show the live output dimensions tooltip during a resize. */
	showDimensions?: boolean;
	/** Minimum zoom level override. Defaults to the coverage-aware minimum. */
	minZoom?: number;
	/** Maximum zoom level. */
	maxZoom?: number;
	/** Fixed aspect ratio (width / height) in pixel space for the crop area. */
	aspectRatio?: number;
	/**
	 * Enable freeform crop mode with resizable handles.
	 * When false (default), the crop area is fixed and centered.
	 * When true, the crop area has resize handles and can be freely repositioned.
	 */
	freeformCrop?: boolean;
	/** Focus the crop area when the cropper mounts. */
	focusOnMount?: boolean;
	/** Callback fired when the image is loaded. */
	onImageLoaded?: ( size: Size ) => void;
	/**
	 * Callback fired on every state change. Fires at pointermove rate
	 * during drags, so keep the handler light — no heavy work, no
	 * expensive parent re-renders. For commit-style events (drag end,
	 * settled crop), use `onGestureEnd` instead.
	 *
	 * Useful for lightweight syncing with external tools, analytics,
	 * or AI agents. Receives the full state so consumers can derive
	 * whatever they need.
	 */
	onStateChange?: ( state: CropperState ) => void;
	/** Fires when a continuous gesture begins (pan drag, handle resize, pinch zoom). */
	onGestureStart?: () => void;
	/** Fires when a continuous gesture ends (pointerup, resize settle). */
	onGestureEnd?: () => void;
	/** Additional className for the container. */
	className?: string;
}

/**
 * The main image cropper component.
 *
 * Renders an image within a container with interactive crop overlays.
 * Creates the camera once per render via getImageFit, then passes
 * derived values to stencil, overlays, and interaction hooks.
 *
 * The component fills its parent container (100% width and height).
 * Wrap it in a sized container to control its dimensions.
 *
 * @param root0                   Component props implementing CropperProps.
 * @param root0.src               Image source URL.
 * @param root0.controller        The cropper controller from `useCropperReducer` or a composite store.
 * @param root0.stencil           Custom stencil component.
 * @param root0.showGrid          Grid overlay mode: false | true | 'interactive'.
 * @param root0.isPlacementActive Keep grid visible during external placement activity.
 * @param root0.showDimming       Show dimming overlay outside crop.
 * @param root0.showDimensions    Show live dimensions tooltip during resize.
 * @param root0.minZoom           Minimum zoom level override.
 * @param root0.maxZoom           Maximum zoom level.
 * @param root0.aspectRatio       Fixed aspect ratio (width/height).
 * @param root0.freeformCrop      Enable resize handles.
 * @param root0.focusOnMount      Focus the crop area on mount.
 * @param root0.onImageLoaded     Image load callback.
 * @param root0.onStateChange     Every-frame state callback.
 * @param root0.onGestureStart    Gesture boundary start.
 * @param root0.onGestureEnd      Gesture boundary end.
 * @param root0.className         Additional CSS class.
 * @param ref                     Forwarded ref for the container div.
 */
function CropperInner(
	{
		src,
		controller,
		stencil: StencilComponent = RectangleStencil,
		showGrid = false,
		isPlacementActive = false,
		showDimming = true,
		showDimensions = true,
		minZoom,
		maxZoom,
		aspectRatio,
		freeformCrop = false,
		focusOnMount = false,
		onImageLoaded,
		onStateChange,
		onGestureStart,
		onGestureEnd,
		className,
	}: CropperProps,
	ref: React.ForwardedRef< HTMLDivElement >
) {
	const {
		state,
		setImage,
		setCropRect,
		settleCrop,
		setVisualSize,
		adjustCropRectForViewport,
	} = controller;
	const {
		viewport: viewportState,
		setViewportPan,
		resetViewport,
	} = useViewport();
	// Canvas measurement via ResizeObserver. The canvas is the inner
	// positioning context for image/stencil/handles — inset from the root
	// by the handle gutter, so crop math operates on the reduced box.
	const canvasRef = useRef< HTMLDivElement >( null );
	const cropAreaDescriptionId = useId();
	const [ isCropAreaFocused, setIsCropAreaFocused ] =
		useState( focusOnMount );
	const [ isFocusVisible, setIsFocusVisible ] = useState( false );
	const [ canvasSize, setCanvasSize ] = useState< Size >( {
		width: 0,
		height: 0,
	} );

	useLayoutEffect( () => {
		if ( focusOnMount ) {
			canvasRef.current?.focus( { preventScroll: true } );
		}
	}, [ focusOnMount ] );

	const handleCropAreaFocus = useCallback(
		( event: React.FocusEvent< HTMLDivElement > ) => {
			const target = event.target as HTMLElement;
			if ( target === event.currentTarget ) {
				setIsCropAreaFocused( true );
			}
			// Show the outline only when focus arrived via keyboard
			// navigation. relatedTarget is null for pointer-initiated and
			// cross-window focus, so it reliably excludes those cases
			// without needing a separate ref or flag. Applies to focus
			// arriving on the canvas itself or on a descendant handle.
			if (
				event.relatedTarget !== null &&
				target.matches( ':focus-visible' )
			) {
				setIsFocusVisible( true );
			}
		},
		[]
	);

	const handleCropAreaBlur = useCallback(
		( event: React.FocusEvent< HTMLDivElement > ) => {
			if ( event.target === event.currentTarget ) {
				setIsCropAreaFocused( false );
			}
			// Reset keyboard-active styling only when focus leaves the
			// cropper entirely. Moves between the canvas and a handle (or
			// between handles) keep the keyboard-active state intact.
			if (
				! event.currentTarget.contains(
					event.relatedTarget as Node | null
				)
			) {
				setIsFocusVisible( false );
			}
		},
		[]
	);

	useEffect( () => {
		const element = canvasRef.current;
		if ( ! element ) {
			return;
		}
		const observer = new ResizeObserver( ( entries ) => {
			for ( const entry of entries ) {
				const { width, height } = entry.contentRect;
				setCanvasSize( ( prev ) => {
					if ( prev.width === width && prev.height === height ) {
						return prev;
					}
					return { width, height };
				} );
			}
		} );
		observer.observe( element );
		return () => {
			observer.disconnect();
		};
	}, [] );

	// Notify consumer of state changes.
	useEffect( () => {
		onStateChange?.( state );
	}, [ state, onStateChange ] );

	// ARIA live region: announce significant state changes for screen readers.
	const ariaMessage = useAriaAnnouncer( state );

	// Compute fitted image dimensions and visual bounds from camera math.
	const naturalWidth = state.image?.naturalWidth ?? 0;
	const naturalHeight = state.image?.naturalHeight ?? 0;
	const { elementSize, visualSize } = useMemo(
		() =>
			getImageFit(
				canvasSize,
				{ width: naturalWidth, height: naturalHeight },
				state.rotation
			),
		[ canvasSize, naturalWidth, naturalHeight, state.rotation ]
	);

	// Report the rendered image size to the controller. Composite
	// controllers need it to compute aspect-ratio reshapes from the
	// reducer (the dropdown dispatches without DOM access); pure
	// controllers ignore it.
	useEffect( () => {
		setVisualSize( visualSize );
	}, [ visualSize, setVisualSize ] );

	// In fixed-crop mode, auto-size the crop rect only when a fixed
	// aspect ratio is selected. With "Free" selected, turning freeform
	// handles off should preserve the user's current unconstrained
	// crop. Uses `adjustCropRectForViewport` so window-resize-driven
	// reshapes don't create undo entries (composite controller); the
	// dedup at lines below avoids redundant dispatches when the
	// reducer has already updated the cropRect for an aspect change.
	useEffect( () => {
		if (
			freeformCrop ||
			visualSize.width === 0 ||
			visualSize.height === 0 ||
			! aspectRatio ||
			aspectRatio <= 0
		) {
			return;
		}
		const rect = computeInscribedRect( aspectRatio, visualSize );
		const current = state.cropRect;
		if (
			Math.abs( current.x - rect.x ) < CROP_RECT_EPSILON &&
			Math.abs( current.y - rect.y ) < CROP_RECT_EPSILON &&
			Math.abs( current.width - rect.width ) < CROP_RECT_EPSILON &&
			Math.abs( current.height - rect.height ) < CROP_RECT_EPSILON
		) {
			return;
		}
		adjustCropRectForViewport( rect );
	}, [
		freeformCrop,
		aspectRatio,
		visualSize,
		adjustCropRectForViewport,
		state.cropRect,
	] );

	// In freeform mode, when aspectRatio changes, reshape the crop to
	// the largest inscribed rect of the new ratio. Bails out when the
	// cropRect already matches the inscribed rect — composite stores
	// reshape atomically inside the reducer, so this effect is a
	// no-op there.
	const prevAspectRatioRef = useRef( aspectRatio );
	useEffect( () => {
		if ( prevAspectRatioRef.current === aspectRatio ) {
			return;
		}
		prevAspectRatioRef.current = aspectRatio;

		if (
			! freeformCrop ||
			visualSize.width === 0 ||
			visualSize.height === 0 ||
			! aspectRatio ||
			aspectRatio <= 0
		) {
			return;
		}
		const rect = computeInscribedRect( aspectRatio, visualSize );
		const current = state.cropRect;
		if (
			Math.abs( current.x - rect.x ) < CROP_RECT_EPSILON &&
			Math.abs( current.y - rect.y ) < CROP_RECT_EPSILON &&
			Math.abs( current.width - rect.width ) < CROP_RECT_EPSILON &&
			Math.abs( current.height - rect.height ) < CROP_RECT_EPSILON
		) {
			return;
		}
		adjustCropRectForViewport( rect );
	}, [
		aspectRatio,
		freeformCrop,
		visualSize,
		adjustCropRectForViewport,
		state.cropRect,
	] );

	// Compute the crop handle bounds from the actual image footprint.
	// Depends on the full state object because getImageCropBounds reads
	// crop, zoom, rotation, flip, and image. React Compiler requires
	// the complete dependency; the computation is lightweight (a few
	// trig ops + 4 corner transforms).
	const cropBounds = useMemo( () => {
		if ( ! state.image || elementSize.width === 0 ) {
			return undefined;
		}
		return getImageCropBounds( state, elementSize, visualSize );
	}, [ state, elementSize, visualSize ] );
	const effectiveMinZoom =
		minZoom !== undefined ? minZoom : getMinZoom( state );
	const [ isResizing, setIsResizing ] = useState( false );
	const isResizingRef = useRef( false );
	const isSettlingRef = useRef( false );
	// Direction of the handle the user is currently resizing — pointer or
	// keyboard. `null` outside of an active resize. Drives the live
	// dimensions tooltip overlay.
	const [ activeHandle, setActiveHandle ] = useState< HandlePosition | null >(
		null
	);

	// Presentational magnification so the at-rest crop fills the canvas. The
	// crop overlay is laid out as `cropRect * visualSize` (the contain-fit
	// footprint, no zoom), so a crop whose aspect differs from the image's can
	// render far smaller than the canvas allows. Scaling `elementSize` and
	// `visualSize` together magnifies the whole scene uniformly — image,
	// overlays, and the pixel->normalized interaction math — and the root's
	// `overflow: hidden` clips the image bleed. Magnifying around the footprint
	// centre keeps the crop centred only because the at-rest crop is always
	// centred (SETTLE_CROP, computeInscribedRect, and the initial full-frame
	// crop all centre it).
	const viewScaleRest = useMemo(
		() =>
			getViewScale(
				state.cropRect,
				canvasSize,
				visualSize,
				SETTLE_TARGET_CANVAS_FILL,
				MAX_VIEW_SCALE
			),
		[ state.cropRect, canvasSize, visualSize ]
	);
	// During a resize the magnification is frozen at its pre-drag value rather
	// than recomputed per pointer move: recomputing live would zoom the scene
	// under the cursor, and snapping to 1 would reset the zoom the moment a
	// handle is grabbed. `handleResizeStart` snapshots the current rest value
	// into `frozenViewScale`; on release the settle recomputes from the new crop.
	const [ frozenViewScale, setFrozenViewScale ] = useState( 1 );
	const viewScale = isResizing ? frozenViewScale : viewScaleRest;
	const scaledVisualSize = useMemo(
		() => ( {
			width: visualSize.width * viewScale,
			height: visualSize.height * viewScale,
		} ),
		[ visualSize.width, visualSize.height, viewScale ]
	);
	// CSS pixels rendered per source pixel: the contain fit
	// (elementSize / natural), times zoom and the view-scale magnification.
	const displayScale =
		naturalWidth > 0
			? ( elementSize.width / naturalWidth ) * state.zoom * viewScale
			: 0;
	const keyboardResizeStep = useMemo( () => {
		if (
			displayScale < PIXEL_SNAP_DISPLAY_SCALE ||
			( aspectRatio && aspectRatio > 0 ) ||
			naturalWidth <= 0 ||
			naturalHeight <= 0
		) {
			return undefined;
		}
		const snapRotation = Math.round( state.rotation / 90 ) * 90;
		if (
			Math.abs( state.rotation - snapRotation ) >=
			CARDINAL_ROTATION_EPSILON
		) {
			return undefined;
		}
		const bbox = getRotatedBBox(
			naturalWidth,
			naturalHeight,
			snapRotation
		);
		if ( bbox.width <= 0 || bbox.height <= 0 ) {
			return undefined;
		}
		// Keyboard steps are normalized crop-space deltas, but snapping wants
		// one source pixel per key press. The normalized delta for one source
		// pixel is different on each axis when the snap-rotation bbox is not
		// square, so this must be an object with separate width/height steps
		// instead of a single scalar.
		return {
			width: state.zoom / bbox.width,
			height: state.zoom / bbox.height,
		};
	}, [
		displayScale,
		aspectRatio,
		naturalWidth,
		naturalHeight,
		state.rotation,
		state.zoom,
	] );

	// Per-axis minimum crop size in normalized space, expressing a pixel floor
	// on the captured source region. cropRect is normalized in the viewport's
	// snap-rotation bbox; the captured source-pixel width is
	// `cropRect.width * bbox.width / zoom`, so the normalized floor scales with
	// `zoom` to keep the source-pixel floor constant. The floor itself adapts to
	// the on-screen display scale (fit × zoom × view scale) via
	// `getMinCropPixels`, so on a large image shown small the crop can't shrink
	// until the handles collapse — it yields to the 24px source floor only once
	// the image is shown large enough.
	const minCropSize: Size | undefined = useMemo( () => {
		if ( naturalWidth <= 0 || naturalHeight <= 0 ) {
			return undefined;
		}
		const snapRotation = Math.round( state.rotation / 90 ) * 90;
		const bbox = getRotatedBBox(
			naturalWidth,
			naturalHeight,
			snapRotation
		);
		const minPixels = getMinCropPixels( displayScale );
		return {
			width: Math.min( 1, ( minPixels * state.zoom ) / bbox.width ),
			height: Math.min( 1, ( minPixels * state.zoom ) / bbox.height ),
		};
	}, [
		naturalWidth,
		naturalHeight,
		state.rotation,
		state.zoom,
		displayScale,
	] );

	const snapCropRect = useCallback(
		( rect: NormalizedRect, handle: HandlePosition ): NormalizedRect => {
			if (
				displayScale < PIXEL_SNAP_DISPLAY_SCALE ||
				naturalWidth <= 0 ||
				naturalHeight <= 0
			) {
				return rect;
			}
			return snapCropRectToSourcePixels(
				state,
				{ width: naturalWidth, height: naturalHeight },
				rect,
				handle
			);
		},
		[ displayScale, naturalWidth, naturalHeight, state ]
	);

	const wasPixelSnapEnabledRef = useRef( false );
	useEffect( () => {
		const isPixelSnapEnabled =
			freeformCrop &&
			( ! aspectRatio || aspectRatio <= 0 ) &&
			displayScale >= PIXEL_SNAP_DISPLAY_SCALE &&
			naturalWidth > 0 &&
			naturalHeight > 0;
		const wasPixelSnapEnabled = wasPixelSnapEnabledRef.current;
		wasPixelSnapEnabledRef.current = isPixelSnapEnabled;

		if ( ! isPixelSnapEnabled || wasPixelSnapEnabled ) {
			return;
		}

		const snappedCropRect = snapCropRectToSourcePixelGrid(
			state,
			{ width: naturalWidth, height: naturalHeight },
			state.cropRect
		);
		const currentCropRect = state.cropRect;
		if (
			Math.abs( currentCropRect.x - snappedCropRect.x ) <
				CROP_RECT_EPSILON &&
			Math.abs( currentCropRect.y - snappedCropRect.y ) <
				CROP_RECT_EPSILON &&
			Math.abs( currentCropRect.width - snappedCropRect.width ) <
				CROP_RECT_EPSILON &&
			Math.abs( currentCropRect.height - snappedCropRect.height ) <
				CROP_RECT_EPSILON
		) {
			return;
		}

		setCropRect( snappedCropRect );
	}, [
		aspectRatio,
		displayScale,
		freeformCrop,
		naturalWidth,
		naturalHeight,
		setCropRect,
		state,
	] );

	// Use the interaction hook for mouse, touch, and keyboard events.
	const {
		handlers,
		onWheelNative,
		isDragging,
		isZooming,
		isPlacementActive: isInteractionPlacementActive,
	} = useInteraction( state, controller, canvasSize, scaledVisualSize, {
		minZoom: effectiveMinZoom,
		maxZoom,
		onGestureStart,
		onGestureEnd,
	} );

	// Compose focus-visibility tracking into the canvas event handlers.
	// Kept as a spread rather than explicit props to avoid triggering
	// jsx-a11y/no-noninteractive-element-interactions on role="group".
	//
	// The pointer/key tracking lives in the capture phase so it runs
	// before any child handler — handles call stopPropagation in their
	// own onPointerDown / onKeyDown, which would otherwise prevent the
	// keyboard-active state from updating when the user interacts with
	// a handle directly.
	const canvasHandlers = {
		...handlers,
		onPointerDownCapture: () => {
			setIsFocusVisible( false );
		},
		onKeyDownCapture: ( event: React.KeyboardEvent< HTMLDivElement > ) => {
			// Modifier-only keypresses precede another key rather than
			// indicating deliberate keyboard interaction on their own.
			if (
				! [ 'Shift', 'Control', 'Alt', 'Meta' ].includes( event.key )
			) {
				setIsFocusVisible( true );
			}
		},
		onPointerDown: ( event: React.PointerEvent< HTMLDivElement > ) => {
			handlers.onPointerDown?.( event );
			// Re-assert false after handlers run — el.focus() inside the
			// handler fires onFocus, which may otherwise set it back to true.
			setIsFocusVisible( false );
		},
	};

	// Register wheel handler natively with { passive: false } so
	// preventDefault works. React's onWheel registers as passive. Bound
	// to the canvas (not the root) so pointer geometry inside the handler
	// resolves against the canvas box.
	useEffect( () => {
		const el = canvasRef.current;
		if ( ! el ) {
			return;
		}
		const handleWheel = ( event: WheelEvent ) => {
			// Block wheel zoom while resizing or settling — the stage CSS
			// transform changes getBoundingClientRect() during this window,
			// so focal-point math would resolve against the wrong center.
			if ( isResizingRef.current || isSettlingRef.current ) {
				event.preventDefault();
				return;
			}
			onWheelNative( event );
		};
		el.addEventListener( 'wheel', handleWheel, {
			passive: false,
		} );
		return () => {
			el.removeEventListener( 'wheel', handleWheel );
		};
	}, [ onWheelNative ] );

	// Use the unscaled contain-fit footprint here. `imageStyle` prepends
	// `scale(viewScale)` to this matrix, so pan translations are magnified with
	// the rest of the scene; using `scaledVisualSize` here would apply viewScale
	// to pan twice.
	const transformString = useTransformStyle( state, visualSize );

	/**
	 * Handle the image load event.
	 */
	const handleImageLoad = useCallback(
		( event: React.SyntheticEvent< HTMLImageElement > ) => {
			const img = event.currentTarget;
			const size: Size = {
				width: img.naturalWidth,
				height: img.naturalHeight,
			};

			setImage( {
				src,
				naturalWidth: size.width,
				naturalHeight: size.height,
			} );

			onImageLoaded?.( size );
		},
		[ src, setImage, onImageLoaded ]
	);

	const handleCropChange = useCallback(
		( rect: NormalizedRect ) => {
			setCropRect( rect );
			// During a resize drag, pan the viewport so the handle stays
			// visible even when the crop extends beyond the canvas edge.
			if (
				isResizingRef.current &&
				scaledVisualSize.width > 0 &&
				scaledVisualSize.height > 0
			) {
				const offsetX =
					( canvasSize.width - scaledVisualSize.width ) / 2;
				const offsetY =
					( canvasSize.height - scaledVisualSize.height ) / 2;
				const rightOverflow = Math.max(
					0,
					offsetX +
						( rect.x + rect.width ) * scaledVisualSize.width -
						canvasSize.width
				);
				const leftOverflow = Math.max(
					0,
					-( offsetX + rect.x * scaledVisualSize.width )
				);
				const bottomOverflow = Math.max(
					0,
					offsetY +
						( rect.y + rect.height ) * scaledVisualSize.height -
						canvasSize.height
				);
				const topOverflow = Math.max(
					0,
					-( offsetY + rect.y * scaledVisualSize.height )
				);
				setViewportPan( {
					x: -rightOverflow + leftOverflow,
					y: -bottomOverflow + topOverflow,
				} );
			}
		},
		[ setCropRect, setViewportPan, canvasSize, scaledVisualSize ]
	);

	// Settling animation: brief linear transition after resize end.
	const [ settling, setSettling ] = useState( false );
	const settleTimerRef = useRef< ReturnType< typeof setTimeout > >();

	// Clear the pending settle timer on unmount so it can't fire a
	// state update on an unmounted component.
	useEffect( () => {
		return () => {
			clearTimeout( settleTimerRef.current );
		};
	}, [] );

	const isInteractiveGrid = showGrid === 'interactive';
	const showInteractiveGrid =
		isInteractiveGrid &&
		( isInteractionPlacementActive || isResizing || isPlacementActive );

	// Output crop size in source pixels — drives the live tooltip
	// overlay. Only computed during pointer drags, so the per-frame
	// state churn during pan/zoom doesn't pay for it.
	const outputSize = useMemo( () => {
		if ( ! showDimensions || ! activeHandle || ! state.image ) {
			return null;
		}
		const region = getSourceRegion( state, {
			width: state.image.naturalWidth,
			height: state.image.naturalHeight,
		} );
		return { width: region.width, height: region.height };
	}, [ showDimensions, activeHandle, state ] );

	/**
	 * Handle Escape on a resize handle — return focus to the canvas so
	 * arrow keys pan the image rather than resize.
	 */
	const handleEscape = useCallback( () => {
		// Escape is always a keyboard action, so show the outline immediately
		// rather than relying on the focus handler's :focus-visible check.
		setIsFocusVisible( true );
		canvasRef.current?.focus( { preventScroll: true } );
	}, [] );

	const handleResizeStart = useCallback(
		( handle?: HandlePosition ) => {
			// Freeze the magnification at its current value so grabbing a
			// handle doesn't reset the zoom; it holds for the whole drag.
			setFrozenViewScale( viewScaleRest );
			isResizingRef.current = true;
			setIsResizing( true );
			setActiveHandle( handle ?? null );
			// Clear any in-flight settle so transitions don't apply during the
			// new drag (rapid successive resizes would otherwise inherit the
			// previous settle animation).
			clearTimeout( settleTimerRef.current );
			isSettlingRef.current = false;
			setSettling( false );
			resetViewport();
			onGestureStart?.();
		},
		[ onGestureStart, resetViewport, viewScaleRest ]
	);

	/**
	 * Handle resize end — settle the crop rect (re-center, fill height)
	 * and reset the viewport pan back to neutral.
	 */
	const handleResizeEnd = useCallback( () => {
		isResizingRef.current = false;
		setIsResizing( false );
		setActiveHandle( null );
		isSettlingRef.current = true;
		setSettling( true );
		// Reset viewport pan first so it transitions back to zero in sync
		// with the settle animation on the image.
		resetViewport();
		settleCrop();
		onGestureEnd?.();
		clearTimeout( settleTimerRef.current );
		settleTimerRef.current = setTimeout( () => {
			isSettlingRef.current = false;
			setSettling( false );
		}, 200 );
	}, [ settleCrop, onGestureEnd, resetViewport ] );

	let imageTransition: string | undefined;
	if ( settling ) {
		imageTransition = 'transform 200ms ease-out';
	} else if ( isZooming ) {
		imageTransition = 'transform 150ms linear';
	}
	const settleStencilTransition = settling
		? 'left 200ms ease-out, top 200ms ease-out, width 200ms ease-out, height 200ms ease-out'
		: undefined;

	// Compute the image's CSS style. The element keeps its contain-fit box; the
	// view-scale magnification is folded into the transform as an outer
	// `scale()` so the whole settle motion (zoom, pan, and magnification) is one
	// coherent transform that interpolates as a unit — the image slides/scales
	// to its position rather than animating its box separately. Magnifying
	// around the centred box keeps the (centred) crop centred.
	const imageStyle = useMemo( (): React.CSSProperties => {
		if ( elementSize.width === 0 || elementSize.height === 0 ) {
			return {};
		}
		const centerX = ( canvasSize.width - elementSize.width ) / 2;
		const centerY = ( canvasSize.height - elementSize.height ) / 2;
		// Above 1:1 the image is upscaled, so render nearest-neighbour to keep
		// pixel boundaries crisp (e.g. small images the cropper magnifies);
		// below 1:1 leave smoothing on for downscaled large images.
		return {
			width: elementSize.width,
			height: elementSize.height,
			maxWidth: elementSize.width,
			maxHeight: elementSize.height,
			left: centerX,
			top: centerY,
			// Always lead with `scale()` (identity at rest) so the transform's
			// function list stays structurally constant across rest, resize, and
			// settle. A conditional that dropped `scale()` at viewScale === 1
			// would change the list shape exactly when the settle transition
			// crosses 1:1, forcing the browser to fall back to matrix-decomposition
			// interpolation instead of interpolating each function in turn.
			transform: `scale(${ viewScale }) ${ transformString }`,
			transition: imageTransition,
			imageRendering: displayScale > 1 ? 'pixelated' : undefined,
		};
	}, [
		canvasSize,
		elementSize,
		transformString,
		imageTransition,
		displayScale,
		viewScale,
	] );

	// Viewport pan CSS transform for the stage div. Applied during resize
	// drags to keep handles visible when the crop extends past the canvas edge.
	// Transitions back to zero during the settle animation.
	// will-change promotes the stage to its own compositor layer while the
	// transform is active, keeping per-frame pan updates off the main thread.
	const settleTransition = settling ? 'transform 200ms ease-out' : undefined;
	const willChange = isResizing || settling ? 'transform' : undefined;
	let stageStyle: React.CSSProperties | undefined;
	if ( viewportState.pan.x !== 0 || viewportState.pan.y !== 0 ) {
		stageStyle = {
			transform: `translate(${ viewportState.pan.x }px, ${ viewportState.pan.y }px)`,
			transition: settleTransition,
			willChange,
		};
	} else if ( settling ) {
		// Animate the viewport pan back to an explicit identity translate rather
		// than dropping the transform property, so the reset eases instead of
		// snapping (transitions to a removed transform are unreliable).
		stageStyle = {
			transform: 'translate(0px, 0px)',
			transition: settleTransition,
			willChange,
		};
	}

	// Forward the root element to the consumer's ref.
	const setContainerRef = useCallback(
		( element: HTMLDivElement | null ) => {
			if ( typeof ref === 'function' ) {
				ref( element );
			} else if ( ref ) {
				(
					ref as React.MutableRefObject< HTMLDivElement | null >
				 ).current = element;
			}
		},
		[ ref ]
	);

	return (
		<div
			ref={ setContainerRef }
			className={ clsx(
				'wp-media-editor-image-editor',
				isDragging && 'wp-media-editor-image-editor--dragging',
				className
			) }
		>
			{ /*
			 * The canvas is the interactive, inset surface. Handles and
			 * the ARIA role/tabIndex live here so pointer geometry
			 * (getBoundingClientRect on e.currentTarget) resolves against
			 * the same box that crop math uses. The root stays as the
			 * clipping shell for the dimming overlay's box-shadow.
			 *
			 * Not role="application" — that disables the screen reader's
			 * normal keyboard interception, too heavy-handed for a single
			 * widget. Screen reader users get the ARIA live region below
			 * as the announcement channel.
			 */ }
			<div
				ref={ canvasRef }
				className={ clsx(
					'wp-media-editor-image-editor__canvas',
					isInteractiveGrid &&
						'wp-media-editor-image-editor__canvas--grid-interactive',
					showInteractiveGrid &&
						'wp-media-editor-image-editor__canvas--show-grid',
					settling &&
						'wp-media-editor-image-editor__canvas--settling',
					// Marks the cropper as in keyboard-interaction mode.
					// CSS uses :focus on the canvas to show the stencil
					// outline and :focus on a handle to show its ring,
					// so the class applies whenever any cropper element
					// has keyboard focus.
					isFocusVisible &&
						'wp-media-editor-image-editor__canvas--focus-visible'
				) }
				tabIndex={ 0 }
				role="group"
				aria-label={ __( 'Crop area' ) }
				aria-describedby={
					isCropAreaFocused ? cropAreaDescriptionId : undefined
				}
				onFocus={ handleCropAreaFocus }
				onBlur={ handleCropAreaBlur }
				{ ...canvasHandlers }
			>
				<div
					id={ cropAreaDescriptionId }
					style={ VISUALLY_HIDDEN_STYLE }
				>
					{ __(
						'When this area is focused, use arrow keys to move the image and plus or minus to zoom. Tab to resize handles and controls.'
					) }
				</div>
				{ /*
				 * The stage is an inner full-size div that receives the
				 * viewport pan CSS transform. Keeping the transform here
				 * (rather than on the canvas) means the canvas always stays
				 * at its natural position, so the root div's background is
				 * never exposed when the stage is panned during a resize drag.
				 */ }
				<div
					className="wp-media-editor-image-editor__stage"
					data-testid="cropper-stage"
					style={ stageStyle }
				>
					{ /* The image layer */ }
					<img
						className="wp-media-editor-image-editor__image"
						data-testid="cropper-image"
						src={ src }
						alt=""
						onLoad={ handleImageLoad }
						style={ imageStyle }
						draggable={ false }
					/>

					{ /* Dimming overlay outside the crop area */ }
					{ showDimming && (
						<DimmingOverlay
							cropRect={ state.cropRect }
							containerSize={ canvasSize }
							imageSize={ scaledVisualSize }
							transition={ settleStencilTransition }
						/>
					) }

					{ /* The stencil (crop area with handles) */ }
					<StencilComponent
						cropRect={ state.cropRect }
						containerSize={ canvasSize }
						imageSize={ scaledVisualSize }
						onCropChange={ handleCropChange }
						onResizeStart={ handleResizeStart }
						onResizeEnd={ handleResizeEnd }
						onEscape={ handleEscape }
						aspectRatio={ aspectRatio }
						freeformCrop={ freeformCrop }
						stencilTransition={ settleStencilTransition }
						cropBounds={ cropBounds }
						minCropSize={ minCropSize }
						snapCropRect={ snapCropRect }
						keyboardResizeStep={ keyboardResizeStep }
					/>

					{ /* Rule-of-thirds grid */ }
					{ ( showGrid === true || isInteractiveGrid ) && (
						<GridOverlay
							cropRect={ state.cropRect }
							containerSize={ canvasSize }
							imageSize={ scaledVisualSize }
						/>
					) }

					{ /* Live dimensions tooltip pinned to the dragged handle. */ }
					{ activeHandle && outputSize && (
						<DimensionsOverlay
							cropRect={ state.cropRect }
							containerSize={ canvasSize }
							imageSize={ scaledVisualSize }
							activeHandle={ activeHandle }
							outputWidth={ outputSize.width }
							outputHeight={ outputSize.height }
						/>
					) }
				</div>

				{ /* ARIA live region for screen reader announcements */ }
				<div
					aria-live="polite"
					aria-atomic="true"
					className="wp-media-editor-image-editor__aria-live"
					style={ VISUALLY_HIDDEN_STYLE }
				>
					{ ariaMessage }
				</div>
			</div>
		</div>
	);
}

const CropperInnerWithRef = forwardRef< HTMLDivElement, CropperProps >(
	CropperInner
);

export const Cropper = forwardRef< HTMLDivElement, CropperProps >(
	( props, ref ) => (
		<ViewportProvider>
			<CropperInnerWithRef { ...props } ref={ ref } />
		</ViewportProvider>
	)
);
