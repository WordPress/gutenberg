/**
 * Pre- and post-processing for the YuNet face detection model.
 *
 * The model is a plain ONNX graph: it takes a square image and returns raw
 * per-cell tensors at three strides. Everything needed to turn an image into
 * that input, and those tensors back into rectangles, lives here, free of any
 * runtime or browser API so it can be tested directly.
 *
 * @see https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet
 */

import type { Detection } from './types';

/**
 * The side of the square the model expects. The published graph has a fixed
 * input shape, so an image is letterboxed into this rather than resized to it.
 */
export const INPUT_SIZE = 640;

/**
 * The feature map strides the model emits predictions at. A stride of 8 covers
 * small faces and 32 covers large ones.
 */
export const STRIDES = [ 8, 16, 32 ] as const;

/**
 * How much two boxes may overlap before the lower scoring one is dropped.
 */
const IOU_THRESHOLD = 0.3;

/**
 * Where an image of the given size sits once it has been letterboxed into a
 * square, and how much it was scaled to get there.
 */
export interface Letterbox {
	scale: number;
	width: number;
	height: number;
	left: number;
	top: number;
}

/**
 * Fits an image inside a square without distorting it, centring what is left.
 *
 * @param width  Source width in pixels.
 * @param height Source height in pixels.
 * @param size   Side of the square. Defaults to the model's input size.
 * @return Where the image lands inside the square.
 */
export function getLetterbox(
	width: number,
	height: number,
	size: number = INPUT_SIZE
): Letterbox {
	const scale = Math.min( size / width, size / height );
	const scaledWidth = Math.round( width * scale );
	const scaledHeight = Math.round( height * scale );
	return {
		scale,
		width: scaledWidth,
		height: scaledHeight,
		left: Math.floor( ( size - scaledWidth ) / 2 ),
		top: Math.floor( ( size - scaledHeight ) / 2 ),
	};
}

/**
 * Converts interleaved RGBA pixels into the planar BGR tensor the model wants.
 *
 * Channel order matters here. YuNet was trained through OpenCV, which loads
 * images as BGR, and feeding RGB costs a few points of confidence on every
 * face rather than failing outright - which is the kind of bug that survives a
 * smoke test.
 *
 * @param pixels RGBA pixels of a square image, row major.
 * @param size   Side of that square.
 * @return Planar BGR values in NCHW order.
 */
export function imageDataToTensor(
	pixels: Uint8ClampedArray,
	size: number = INPUT_SIZE
): Float32Array {
	const plane = size * size;
	const tensor = new Float32Array( 3 * plane );
	for ( let i = 0; i < plane; i++ ) {
		const offset = i * 4;
		tensor[ i ] = pixels[ offset + 2 ];
		tensor[ plane + i ] = pixels[ offset + 1 ];
		tensor[ 2 * plane + i ] = pixels[ offset ];
	}
	return tensor;
}

/**
 * The raw tensors a single forward pass produces, keyed by output name.
 */
export type YuNetOutputs = Record< string, Float32Array >;

/**
 * A box in the coordinates of the letterboxed square.
 */
interface RawBox {
	left: number;
	top: number;
	width: number;
	height: number;
	confidence: number;
}

/**
 * Turns the model's per-cell tensors into boxes.
 *
 * Each cell predicts a classification score and an objectness score; the
 * geometric mean of the two is the confidence, which is what OpenCV's own
 * implementation reports. Box coordinates are offsets from the cell centre in
 * stride units, with the size stored as a logarithm.
 *
 * @param outputs       Tensors from one forward pass.
 * @param size          Side of the square that was fed in.
 * @param minConfidence Boxes scoring below this are not returned.
 * @return Boxes in letterboxed coordinates, before overlap is resolved.
 */
export function decodeDetections(
	outputs: YuNetOutputs,
	size: number = INPUT_SIZE,
	minConfidence = 0.7
): RawBox[] {
	const boxes: RawBox[] = [];

	for ( const stride of STRIDES ) {
		const cls = outputs[ `cls_${ stride }` ];
		const obj = outputs[ `obj_${ stride }` ];
		const bbox = outputs[ `bbox_${ stride }` ];
		if ( ! cls || ! obj || ! bbox ) {
			continue;
		}

		const columns = size / stride;
		for ( let cell = 0; cell < cls.length; cell++ ) {
			const confidence = Math.sqrt(
				clamp01( cls[ cell ] ) * clamp01( obj[ cell ] )
			);
			if ( confidence < minConfidence ) {
				continue;
			}

			const column = cell % columns;
			const row = Math.floor( cell / columns );
			const centreX = ( column + bbox[ cell * 4 ] ) * stride;
			const centreY = ( row + bbox[ cell * 4 + 1 ] ) * stride;
			const width = Math.exp( bbox[ cell * 4 + 2 ] ) * stride;
			const height = Math.exp( bbox[ cell * 4 + 3 ] ) * stride;

			boxes.push( {
				left: centreX - width / 2,
				top: centreY - height / 2,
				width,
				height,
				confidence,
			} );
		}
	}

	return boxes;
}

/**
 * Keeps the highest scoring box out of each cluster of overlapping ones.
 *
 * @param boxes     Candidate boxes.
 * @param threshold Intersection over union above which a box is a duplicate.
 * @return The boxes that survived, highest scoring first.
 */
export function nonMaximumSuppression(
	boxes: RawBox[],
	threshold: number = IOU_THRESHOLD
): RawBox[] {
	const sorted = [ ...boxes ].sort( ( a, b ) => b.confidence - a.confidence );
	const kept: RawBox[] = [];

	for ( const box of sorted ) {
		if ( ! kept.some( ( other ) => iou( box, other ) > threshold ) ) {
			kept.push( box );
		}
	}

	return kept;
}

/**
 * Maps boxes out of the letterboxed square and back onto the original image,
 * as fractions of its width and height.
 *
 * Boxes are clamped to the image because a face at the very edge of the frame
 * can be predicted as extending past it.
 *
 * @param boxes     Boxes in letterboxed coordinates.
 * @param letterbox Where the image sat inside the square.
 * @return Detections in normalized image coordinates.
 */
export function toNormalizedDetections(
	boxes: RawBox[],
	letterbox: Letterbox
): Detection[] {
	const { left: padLeft, top: padTop, width, height } = letterbox;

	return boxes.map( ( box ) => {
		const x0 = clamp01( ( box.left - padLeft ) / width );
		const y0 = clamp01( ( box.top - padTop ) / height );
		const x1 = clamp01( ( box.left + box.width - padLeft ) / width );
		const y1 = clamp01( ( box.top + box.height - padTop ) / height );

		return {
			x: x0,
			y: y0,
			width: x1 - x0,
			height: y1 - y0,
			confidence: box.confidence,
		};
	} );
}

/**
 * @param value Any number.
 * @return The value pinned to the 0-1 range.
 */
function clamp01( value: number ): number {
	return Math.max( 0, Math.min( 1, value ) );
}

/**
 * @param a First box.
 * @param b Second box.
 * @return How much the two boxes overlap, as intersection over union.
 */
function iou( a: RawBox, b: RawBox ): number {
	const overlapWidth = Math.max(
		0,
		Math.min( a.left + a.width, b.left + b.width ) -
			Math.max( a.left, b.left )
	);
	const overlapHeight = Math.max(
		0,
		Math.min( a.top + a.height, b.top + b.height ) -
			Math.max( a.top, b.top )
	);
	const intersection = overlapWidth * overlapHeight;
	const union = a.width * a.height + b.width * b.height - intersection;
	return union > 0 ? intersection / union : 0;
}
