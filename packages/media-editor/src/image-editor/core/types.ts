import type { mat2d } from 'gl-matrix';

/**
 * A 2D camera represented as a 2×3 affine transformation matrix (`mat2d`).
 *
 * This is not a camera object with properties — it's a raw 6-element matrix
 * `[a, b, c, d, tx, ty]` that maps normalized world coordinates [0,1] to
 * screen pixels. It composes pan, rotation, flip, zoom, and contain-fit
 * into a single transform.
 *
 * Use `createCamera()` to build one from `CropperState`, then pass it to
 * `worldToScreen()` / `screenToWorld()` for coordinate conversion.
 *
 * A 3D camera would use `mat4`; this is strictly 2D (no perspective).
 */
export type Camera = mat2d;

/**
 * A point with normalized coordinates (0-1 range relative to image dimensions).
 */
export interface NormalizedPoint {
	x: number;
	y: number;
}

/**
 * A rectangle with normalized coordinates (0-1 range).
 * Origin is the top-left corner of the image.
 */
export interface NormalizedRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Width and height dimensions.
 */
export interface Size {
	width: number;
	height: number;
}

/**
 * Flip state for horizontal and vertical axes.
 */
export interface Flip {
	horizontal: boolean;
	vertical: boolean;
}

/**
 * A JSON-serializable transform operation for the non-destructive pipeline.
 */
export type TransformOperation =
	| { type: 'crop'; rect: NormalizedRect }
	| { type: 'rotate'; degrees: number }
	| { type: 'flip'; direction: 'horizontal' | 'vertical' }
	| { type: 'zoom'; factor: number };

/**
 * Full cropper state.
 */
export interface CropperState {
	/** The source image information. Null until an image is loaded. */
	image: {
		src: string;
		naturalWidth: number;
		naturalHeight: number;
	} | null;
	/**
	 * Image pan offset in normalized coordinates. Not the crop
	 * rectangle — that's `cropRect` below.
	 */
	pan: NormalizedPoint;
	/** Zoom level. 1 = no zoom. */
	zoom: number;
	/** Rotation in degrees, normalized to 0-360. */
	rotation: number;
	/**
	 * Base pan/zoom/rotation — the pose the user last explicitly set.
	 *
	 * During continuous fine rotation (SET_ROTATION), every tick
	 * re-derives the transient `pan`/`zoom` from these base values
	 * rather than compounding on the previous tick. This prevents
	 * drift from accumulated containment clamping near image edges:
	 * rotating 0°→30°→0° returns to the exact starting pan, not a
	 * slightly-nudged version of it.
	 *
	 * These are updated by every action except SET_ROTATION itself —
	 * explicit zoom, pan, crop-rect, flip, and 90° snap all commit
	 * the post-containment state into base. SET_ROTATION reads from
	 * `basePan` and `baseRotation` to compute the new pan, and reads
	 * `baseZoom` as the zoom floor (enforceContainment may bump it up
	 * to cover the rotated crop, but never leaves it above baseZoom).
	 */
	basePan: NormalizedPoint;
	baseZoom: number;
	baseRotation: number;
	/** Flip state. */
	flip: Flip;
	/** The crop rectangle in normalized coordinates. */
	cropRect: NormalizedRect;
}

/**
 * Internal reducer action union.
 *
 * This type is intentionally not exported from the image-editor public barrel.
 * Consumers should drive state through the controller returned by
 * `useCropperReducer()` (or a composite store) or through serializable
 * `TransformOperation` values.
 */
export type CropperAction =
	/** Sets the loaded image metadata (natural size, src). */
	| { type: 'SET_IMAGE'; payload: CropperState[ 'image' ] }
	/** Sets the image pan offset. (Crop rectangle is SET_CROP_RECT.) */
	| { type: 'SET_PAN'; payload: NormalizedPoint }
	/** Sets the zoom level, clamped to [coverage-aware min, MAX_ZOOM]. */
	| { type: 'SET_ZOOM'; payload: number }
	/**
	 * Sets zoom and pan together atomically. Used by focal-point
	 * zoom (wheel, pinch) to keep a target point stationary while
	 * zoom changes.
	 */
	| {
			type: 'SET_ZOOM_AT_POINT';
			payload: { zoom: number; pan: NormalizedPoint };
	  }
	/** Sets the absolute rotation angle in degrees. */
	| { type: 'SET_ROTATION'; payload: number }
	/** Rotates by +/-90 degrees (snap). */
	| { type: 'SNAP_ROTATE_90'; payload: { direction: 1 | -1 } }
	/** Sets the flip state. */
	| { type: 'SET_FLIP'; payload: Flip }
	/** Sets the crop rectangle. */
	| { type: 'SET_CROP_RECT'; payload: NormalizedRect }
	/** Settle animation after resize drag, recentering the crop rect. */
	| { type: 'SETTLE_CROP' }
	/** Applies a single pipeline transform via the reducer. */
	| { type: 'APPLY_OPERATION'; payload: TransformOperation }
	/** Resets to DEFAULT_STATE, optionally merging a partial override. */
	| { type: 'RESET'; payload?: Partial< CropperState > };

/**
 * Viewport camera state — display-only, does not affect export or undo.
 *
 * Applied as a CSS transform on the inner stage div so the user can scroll
 * the view independently of the crop. zoom > 1 magnifies; pan shifts in CSS px.
 */
export interface ViewportState {
	zoom: number;
	pan: { x: number; y: number };
}

export type ViewportAction =
	| { type: 'SET_VIEWPORT_ZOOM'; payload: number }
	| { type: 'SET_VIEWPORT_PAN'; payload: { x: number; y: number } }
	| { type: 'RESET_VIEWPORT' };

/**
 * Direction of a crop resize handle. Eight compass positions: four
 * corners and four edge midpoints. Used by stencil callbacks and any
 * overlay that needs to know which handle the user is dragging.
 */
export type HandlePosition = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

/**
 * The contract for a pluggable stencil component.
 * Stencils render the crop area overlay and handle resize interactions.
 */
export interface StencilProps {
	/** The current crop rectangle in normalized coordinates. */
	cropRect: NormalizedRect;
	/** The container element dimensions in pixels. */
	containerSize: Size;
	/** The rendered image dimensions in pixels within the container. */
	imageSize: Size;
	/** Callback when the crop rectangle changes (during drag). */
	onCropChange: ( rect: NormalizedRect ) => void;
	/**
	 * Callback when a resize interaction starts — pointerdown on a handle
	 * or the first arrow-key press on a focused handle. The handle direction
	 * is passed so downstream overlays can anchor to it. The argument is
	 * optional to keep custom stencils that don't track a direction
	 * backward-compatible.
	 */
	onResizeStart?: ( handle?: HandlePosition ) => void;
	/** Callback when a resize drag ends (mouseup after handle drag). */
	onResizeEnd?: () => void;
	/** Optional fixed aspect ratio (width / height) in pixel space. */
	aspectRatio?: number;
	/** Whether the crop handles are shown for freeform resizing. */
	freeformCrop?: boolean;
	/** Whether resize handles should ignore pointer and keyboard input. */
	isResizeDisabled?: boolean;
	/** CSS transition string for settle animation. */
	stencilTransition?: string;
	/** Maximum crop rect bounds based on current zoom/rotation. */
	cropBounds?: {
		minX: number;
		minY: number;
		maxX: number;
		maxY: number;
	};
	/** Called when Escape is pressed on a resize handle. */
	onEscape?: () => void;
	/**
	 * Minimum crop rect dimension in normalized space, per axis. Derived
	 * by the host from a pixel-based floor (see `MIN_CROP_PIXELS`) and
	 * the source image dimensions. Omit to use the stencil's default.
	 */
	minCropSize?: Size;
	/**
	 * Optional post-processor for freeform resize output. Hosts use this for
	 * display-gated behavior such as snapping visible pixel grids to source
	 * pixel boundaries.
	 */
	snapCropRect?: (
		rect: NormalizedRect,
		handle: HandlePosition
	) => NormalizedRect;
	/**
	 * Optional keyboard resize step in normalized space, per axis. Hosts use
	 * this when keyboard resize should follow the rendered image scale instead
	 * of the default percentage-based step.
	 */
	keyboardResizeStep?: Size;
}
