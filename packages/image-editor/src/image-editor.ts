/**
 * The public names and types for the editor. They point at the cropper
 * code inside the package, which keeps its own names and its fuller types:
 * the canvas needs more of the controller than a consumer does.
 */
import type { ComponentType, Ref } from '@wordpress/element';
import { Cropper, type CropperProps } from './react/components';
import { useCropperController, createCropperState } from './react/hooks';
import { areCropperStatesEqual } from './core';
import type { Flip, NormalizedPoint, NormalizedRect } from './core/types';

declare const imageEditorStateBrand: unique symbol;

/**
 * The state of an image editor. Store it and pass it back, but create it
 * with `createImageEditorState` and change it only through the
 * controller: it also carries values the editor keeps for itself.
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
	/** Whether the image is mirrored along each axis. */
	readonly flip: Readonly< Flip >;
	/** The crop area, as fractions of the view the canvas shows. */
	readonly cropRect: Readonly< NormalizedRect >;
	/**
	 * Locked width / height ratio of the crop, in source pixels.
	 * `undefined` means free: the crop can take any shape.
	 */
	readonly aspectRatio?: number;
	/** Stops objects not made by the package from passing as a state. */
	readonly [ imageEditorStateBrand ]: true;
}

/**
 * The controller `useImageEditor` returns: the current state, the
 * changes a person can make, and the limits for building controls.
 */
export interface ImageEditorController {
	/** The current state. */
	readonly state: ImageEditorState;
	/** Whether the edit differs from the starting state for the image. */
	readonly isDirty: boolean;
	/** The smallest zoom that still covers the crop area. */
	readonly minZoom: number;
	/** The largest zoom. */
	readonly maxZoom: number;
	/** How far, in degrees, fine rotation goes either way of a quarter turn. */
	readonly maxRotationOffset: number;
	/** Load an image, or clear it with `null`. */
	setImage: ( image: ImageEditorState[ 'image' ] ) => void;
	/** Go back to the starting state for the loaded image. */
	reset: () => void;
	/** Move the image under the crop, in fractions of the image. */
	setPan: ( pan: NormalizedPoint ) => void;
	/** Zoom around the centre of the crop. */
	setZoom: ( zoom: number ) => void;
	/** Rotate to an angle in degrees, clockwise. */
	setRotation: ( rotation: number ) => void;
	/** Rotate a quarter turn: `1` clockwise, `-1` counter-clockwise. */
	snapRotate90: ( direction: 1 | -1 ) => void;
	/** Mirror the image along each axis that is `true`. */
	setFlip: ( flip: Flip ) => void;
	/** Mirror the image along one axis, or undo that. */
	toggleFlip: ( direction: 'horizontal' | 'vertical' ) => void;
	/** Set the crop area, in fractions of the view the canvas shows. */
	setCropRect: ( rect: NormalizedRect ) => void;
	/**
	 * Lock the crop to a width / height ratio in source pixels, or unlock
	 * it with `undefined`. Locking reshapes the crop to the largest box of
	 * that ratio.
	 */
	setAspectRatio: ( aspectRatio: number | undefined ) => void;
}

/**
 * Options for `useImageEditor`. The consumer keeps the state, for example
 * in its own undo history.
 */
export interface ImageEditorOptions {
	/** The current state. Start from `createImageEditorState()`. */
	state: ImageEditorState;
	/**
	 * Called with the next state. `isEdit` is `false` for changes the
	 * person did not make, such as an image loading or the crop being
	 * refitted after a window resize, which usually should not get an
	 * undo entry.
	 */
	onChange: (
		nextState: ImageEditorState,
		details: { isEdit: boolean }
	) => void;
}

/** Props for `ImageEditorCanvas`. */
export interface ImageEditorCanvasProps extends Omit<
	CropperProps,
	'controller'
> {
	/** The controller from `useImageEditor`. */
	controller: ImageEditorController;
}

/**
 * The canvas the person edits the image on. It fills its parent, so
 * render it inside a sized element.
 */
export const ImageEditorCanvas = Cropper as unknown as ComponentType<
	ImageEditorCanvasProps & { ref?: Ref< HTMLDivElement > }
>;

/**
 * React hook for an image editor. The consumer keeps the state and gets
 * each change through `onChange`.
 */
export const useImageEditor = useCropperController as unknown as (
	options: ImageEditorOptions
) => ImageEditorController;

/**
 * The state an editor starts from for an image, or for no image yet.
 */
export const createImageEditorState = createCropperState as unknown as (
	image?: ImageEditorState[ 'image' ]
) => ImageEditorState;

/**
 * Whether two states describe the same edit, ignoring tiny floating-point
 * differences. Use it to skip entries that change nothing in your own
 * undo history.
 */
export const areImageEditorStatesEqual = areCropperStatesEqual as unknown as (
	a: ImageEditorState,
	b: ImageEditorState
) => boolean;
