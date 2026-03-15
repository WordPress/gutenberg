import type { mat2d } from 'gl-matrix';

export type Camera = mat2d;

/**
 * A point with normalized coordinates (0-1 range relative to image dimensions).
 */
export interface NormalizedPoint {
	x: number;
	y: number;
}

/**
 * A point in pixel coordinates.
 */
export interface PixelPoint {
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
 * A rectangle in pixel coordinates.
 */
export interface PixelRect {
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
 * A JSON-serializable transform operation.
 * Designed for programmatic use by AI agents, undo stacks, and serialization.
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
	/** Pan offset in normalized coordinates. */
	crop: NormalizedPoint;
	/** Zoom level. 1 = no zoom. */
	zoom: number;
	/** Rotation in degrees, normalized to 0-360. */
	rotation: number;
	/** Flip state. */
	flip: Flip;
	/** The crop rectangle in normalized coordinates. */
	cropRect: NormalizedRect;
}

/**
 * Actions for the cropper reducer.
 */
export type CropperAction =
	| { type: 'SET_IMAGE'; payload: CropperState[ 'image' ] }
	| { type: 'SET_CROP'; payload: NormalizedPoint }
	| { type: 'SET_ZOOM'; payload: number }
	| { type: 'SET_ROTATION'; payload: number }
	| { type: 'SET_FLIP'; payload: Flip }
	| { type: 'SET_CROP_RECT'; payload: NormalizedRect }
	| { type: 'APPLY_OPERATION'; payload: TransformOperation }
	| { type: 'RESET'; payload?: Partial< CropperState > };

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
	/** Callback when the crop rectangle changes. */
	onCropChange: ( rect: NormalizedRect ) => void;
}
