import type { mat2d } from 'gl-matrix';

/**
 * A 2D matrix (`mat2d`) that maps points on the image, in fractions from 0
 * to 1, to screen pixels. It combines the pan, rotation, flip, zoom and the
 * fit of the image in the container. Build one with `createCamera()`, and
 * convert points with `worldToScreen()` and `screenToWorld()`.
 */
export type Camera = mat2d;

/**
 * A point in fractions rather than pixels. What it is a fraction of
 * depends on the field that holds it: a pan is a signed offset from the
 * centre, so it can be negative.
 */
export interface NormalizedPoint {
	x: number;
	y: number;
}

/**
 * A rectangle in fractions rather than pixels, measured from its
 * top-left corner. What it is a fraction of depends on the field that
 * holds it.
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
 * The state of an image editor, as consumers see it. Store it and pass it
 * back, but create it with `createImageEditorState` and change it only
 * through the controller: the stored object also carries values the
 * editor keeps for itself (see `InternalImageEditorState`).
 */
export interface ImageEditorState {
	/** The loaded image, or `null` before one loads. */
	readonly image: {
		readonly src: string;
		readonly naturalWidth: number;
		readonly naturalHeight: number;
	} | null;
	/** Where the image sits under the crop, as fractions of the image. */
	readonly pan: Readonly< NormalizedPoint >;
	/** Zoom level. 1 = no zoom. */
	readonly zoom: number;
	/** Rotation in degrees, clockwise, from 0 to 360. */
	readonly rotation: number;
	/** Whether the image is flipped along each axis. */
	readonly flip: Readonly< Flip >;
	/**
	 * The crop area, as fractions of the view the canvas shows. The view
	 * has the shape of the image at its rotation snapped to a quarter turn.
	 */
	readonly cropRect: Readonly< NormalizedRect >;
	/**
	 * Locked width / height ratio of the crop, in source pixels.
	 * `undefined` means free: the crop can take any shape.
	 */
	readonly aspectRatio?: number;
}

/**
 * The full state the editor stores: what consumers see, plus the base
 * pan, zoom and rotation the reducer keeps for fine rotation. The fields
 * shared with `ImageEditorState` mean the same as there.
 */
export interface InternalImageEditorState {
	image: {
		src: string;
		naturalWidth: number;
		naturalHeight: number;
	} | null;
	pan: NormalizedPoint;
	zoom: number;
	rotation: number;
	/**
	 * Base pan, zoom and rotation: the pose the person last set.
	 *
	 * During continuous fine rotation (SET_ROTATION), every tick
	 * re-derives the transient `pan`/`zoom` from these base values
	 * rather than compounding on the previous tick. This prevents
	 * drift from accumulated containment clamping near image edges:
	 * rotating 0°→30°→0° returns to the exact starting pan, not a
	 * slightly-nudged version of it.
	 *
	 * Explicit zoom, pan, crop, and flip changes commit the contained
	 * pose. A 90° turn keeps the unclamped pan in `basePan`, allowing
	 * later turns to restore a position that could not fit in between.
	 * SET_ROTATION derives from the base without committing it.
	 */
	basePan: NormalizedPoint;
	baseZoom: number;
	baseRotation: number;
	flip: Flip;
	cropRect: NormalizedRect;
	aspectRatio?: number;
}

/**
 * The reducer's actions. Not exported: consumers change the state through
 * the controller from `useImageEditor`.
 */
export type ImageEditorAction =
	/** Sets the loaded image metadata (natural size, src). */
	| { type: 'SET_IMAGE'; payload: InternalImageEditorState[ 'image' ] }
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
	/**
	 * Locks the crop to a width / height ratio, or unlocks it with
	 * `undefined`. Locking reshapes the crop to the largest box of that
	 * ratio once an image is loaded.
	 */
	| { type: 'SET_ASPECT_RATIO'; payload: number | undefined }
	/** Settle animation after resize drag, recentering the crop rect. */
	| { type: 'SETTLE_CROP' }
	/** Resets to DEFAULT_STATE, optionally merging a partial override. */
	| { type: 'RESET'; payload?: Partial< InternalImageEditorState > };

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
 * What the stencil takes. The stencil draws the crop area over the image
 * and handles resizing it. `RectangleStencil` is the only one today; the
 * canvas does not take one as a prop.
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
	 * is passed so overlays can anchor to it, and is left out by a
	 * stencil that does not track one.
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
