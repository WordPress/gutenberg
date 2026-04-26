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
	forwardRef,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type {
	CropperState,
	StencilProps,
	Size,
	NormalizedRect,
} from '../../core/types';
import type { UseCropperStateReturn } from '../hooks/use-cropper-state';
import { getImageFit } from '../../core/camera';
import { getCropBounds } from '../../core/containment';
import { useInteraction } from '../hooks/use-interaction';
import { useTransformStyle } from '../hooks/use-transform-style';
import { useAriaAnnouncer } from '../hooks/use-aria-announcer';
import { RectangleStencil } from './stencils/rectangle-stencil';
import { DimmingOverlay } from './overlays/dimming-overlay';
import { GridOverlay } from './overlays/grid-overlay';
import './cropper.scss';

/** Threshold for comparing normalized crop rect values. */
const CROP_RECT_EPSILON = 1e-6;

// Largest rect of the given pixel aspect ratio that fits inside the visual
// bounds, centered in [0,1] × [0,1] normalized space. Returns a full-frame
// rect (1×1) if `aspectRatio` is unset or non-positive.
function computeInscribedRect(
	aspectRatio: number | undefined,
	visualSize: Size
): NormalizedRect {
	let w = 1;
	let h = 1;
	if ( aspectRatio && aspectRatio > 0 && visualSize.width > 0 ) {
		// normalizedRatio = w/h in normalized space that produces the
		// desired pixel aspect ratio.
		// pixelW = w * visualW, pixelH = h * visualH
		// pixelW / pixelH = aspectRatio
		// => w / h = aspectRatio * visualH / visualW
		const normalizedRatio =
			( aspectRatio * visualSize.height ) / visualSize.width;
		if ( normalizedRatio <= 1 ) {
			w = normalizedRatio;
		} else {
			h = 1 / normalizedRatio;
		}
	}
	return {
		x: ( 1 - w ) / 2,
		y: ( 1 - h ) / 2,
		width: w,
		height: h,
	};
}

/**
 * Props for the Cropper component.
 */
export interface CropperProps {
	/** Image source URL. */
	src: string;
	/** The full state/setter object from `useCropperState`. */
	controller: UseCropperStateReturn;
	/** Stencil component for the crop area. Defaults to RectangleStencil. */
	stencil?: React.ComponentType< StencilProps >;
	/** Show the rule-of-thirds grid overlay. */
	showGrid?: boolean;
	/** Show the dimming overlay outside the crop area. */
	showDimming?: boolean;
	/** Minimum zoom level. */
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
 * @param root0                Component props implementing CropperProps.
 * @param root0.src            Image source URL.
 * @param root0.controller     The full state/setter object from `useCropperState`.
 * @param root0.stencil        Custom stencil component.
 * @param root0.showGrid       Show rule-of-thirds grid overlay.
 * @param root0.showDimming    Show dimming overlay outside crop.
 * @param root0.minZoom        Minimum zoom level.
 * @param root0.maxZoom        Maximum zoom level.
 * @param root0.aspectRatio    Fixed aspect ratio (width/height).
 * @param root0.freeformCrop   Enable resize handles.
 * @param root0.onImageLoaded  Image load callback.
 * @param root0.onStateChange  Every-frame state callback.
 * @param root0.onGestureStart Gesture boundary start.
 * @param root0.onGestureEnd   Gesture boundary end.
 * @param root0.className      Additional CSS class.
 * @param ref                  Forwarded ref for the container div.
 */
function CropperInner(
	{
		src,
		controller,
		stencil: StencilComponent = RectangleStencil,
		showGrid = false,
		showDimming = true,
		minZoom,
		maxZoom,
		aspectRatio,
		freeformCrop = false,
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
		__dispatch: dispatch,
	} = controller;
	// Canvas measurement via ResizeObserver. The canvas is the inner
	// positioning context for image/stencil/handles — inset from the root
	// by the handle gutter, so crop math operates on the reduced box.
	const canvasRef = useRef< HTMLDivElement >( null );
	const [ canvasSize, setCanvasSize ] = useState< Size >( {
		width: 0,
		height: 0,
	} );

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

	// In fixed-crop mode, auto-size the crop rect to fill the visual area
	// while respecting the aspect ratio. The crop is always centered.
	useEffect( () => {
		if (
			freeformCrop ||
			visualSize.width === 0 ||
			visualSize.height === 0
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
		setCropRect( rect );
	}, [ freeformCrop, aspectRatio, visualSize, setCropRect, state.cropRect ] );

	// In freeform mode, when aspectRatio changes, reshape the crop to the
	// largest inscribed rect of the new ratio.
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
		setCropRect( computeInscribedRect( aspectRatio, visualSize ) );
	}, [ aspectRatio, freeformCrop, visualSize, setCropRect ] );

	// Compute the crop handle bounds from the actual image footprint.
	// Depends on the full state object because getCropBounds reads
	// crop, zoom, rotation, flip, and image. React Compiler requires
	// the complete dependency; the computation is lightweight (a few
	// trig ops + 4 corner transforms).
	const cropBounds = useMemo( () => {
		if ( ! state.image || elementSize.width === 0 ) {
			return undefined;
		}
		return getCropBounds( state, elementSize, visualSize, canvasSize );
	}, [ state, elementSize, visualSize, canvasSize ] );

	// Use the interaction hook for mouse, touch, and keyboard events.
	const { handlers, onWheelNative, isDragging, isZooming } = useInteraction(
		state,
		dispatch,
		canvasSize,
		visualSize,
		{
			minZoom,
			maxZoom,
			onGestureStart,
			onGestureEnd,
		}
	);

	// Register wheel handler natively with { passive: false } so
	// preventDefault works. React's onWheel registers as passive. Bound
	// to the canvas (not the root) so pointer geometry inside the handler
	// resolves against the canvas box.
	useEffect( () => {
		const el = canvasRef.current;
		if ( ! el ) {
			return;
		}
		el.addEventListener( 'wheel', onWheelNative, {
			passive: false,
		} );
		return () => {
			el.removeEventListener( 'wheel', onWheelNative );
		};
	}, [ onWheelNative ] );

	// Use the transform style hook for the image CSS transform.
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

	/**
	 * Handle crop rect changes from the stencil (during drag).
	 */
	const handleCropChange = useCallback(
		( rect: NormalizedRect ) => {
			setCropRect( rect );
		},
		[ setCropRect ]
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

	/**
	 * Handle Escape on a resize handle — return focus to the canvas so
	 * arrow keys pan the image rather than resize.
	 */
	const handleEscape = useCallback( () => {
		canvasRef.current?.focus( { preventScroll: true } );
	}, [] );

	/**
	 * Handle resize end — settle the crop rect (re-center, fill height).
	 */
	const handleResizeEnd = useCallback( () => {
		setSettling( true );
		settleCrop();
		onGestureEnd?.();
		clearTimeout( settleTimerRef.current );
		settleTimerRef.current = setTimeout( () => {
			setSettling( false );
		}, 200 );
	}, [ settleCrop, onGestureEnd ] );

	const imageTransition =
		settling || isZooming ? 'transform 150ms linear' : undefined;
	const settleStencilTransition = settling
		? 'left 150ms linear, top 150ms linear, width 150ms linear, height 150ms linear'
		: undefined;

	// Compute the image's CSS style.
	const imageStyle = useMemo( (): React.CSSProperties => {
		if ( elementSize.width === 0 || elementSize.height === 0 ) {
			return {};
		}
		const centerX = ( canvasSize.width - elementSize.width ) / 2;
		const centerY = ( canvasSize.height - elementSize.height ) / 2;
		return {
			width: elementSize.width,
			height: elementSize.height,
			maxWidth: elementSize.width,
			maxHeight: elementSize.height,
			left: centerX,
			top: centerY,
			transform: transformString,
			transition: imageTransition,
		};
	}, [ canvasSize, elementSize, transformString, imageTransition ] );

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
				className="wp-media-editor-image-editor__canvas"
				tabIndex={ 0 }
				role="group"
				aria-label={ __( 'Image editor' ) }
				{ ...handlers }
			>
				{ /* The image layer */ }
				<img
					className="wp-media-editor-image-editor__image"
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
						imageSize={ visualSize }
					/>
				) }

				{ /* The stencil (crop area with handles) */ }
				<StencilComponent
					cropRect={ state.cropRect }
					containerSize={ canvasSize }
					imageSize={ visualSize }
					onCropChange={ handleCropChange }
					onResizeStart={ onGestureStart }
					onResizeEnd={ handleResizeEnd }
					onEscape={ handleEscape }
					aspectRatio={ aspectRatio }
					freeformCrop={ freeformCrop }
					stencilTransition={ settleStencilTransition }
					cropBounds={ cropBounds }
				/>

				{ /* Rule-of-thirds grid */ }
				{ showGrid && (
					<GridOverlay
						cropRect={ state.cropRect }
						containerSize={ canvasSize }
						imageSize={ visualSize }
					/>
				) }

				{ /* ARIA live region for screen reader announcements */ }
				<div
					aria-live="polite"
					aria-atomic="true"
					className="wp-media-editor-image-editor__aria-live"
					style={ {
						position: 'absolute',
						width: 1,
						height: 1,
						padding: 0,
						margin: -1,
						overflow: 'hidden',
						clip: 'rect(0, 0, 0, 0)',
						whiteSpace: 'nowrap',
						border: 0,
					} }
				>
					{ ariaMessage }
				</div>
			</div>
		</div>
	);
}

export const Cropper = forwardRef< HTMLDivElement, CropperProps >(
	CropperInner
);
