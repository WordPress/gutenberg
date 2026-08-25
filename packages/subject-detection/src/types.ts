/**
 * A rectangle expressed as a fraction of the image it sits in, so it survives
 * the resize that happens between detection and cropping.
 *
 * `x` and `y` are the top left corner.
 */
export interface NormalizedRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * One thing the detector found, with the score it reported for it.
 */
export interface Detection extends NormalizedRect {
	/**
	 * How sure the detector is, 0-1. This comes from the model rather than
	 * being derived from the geometry, which is the point of using a detector
	 * at all: a low score is a usable signal to leave the crop alone.
	 */
	confidence: number;
}

/**
 * The area a crop should try to keep, and how much to trust it.
 */
export interface SubjectArea extends NormalizedRect {
	/**
	 * The highest confidence among the detections that make up this area.
	 */
	confidence: number;
	/**
	 * What produced the area. Only `face` today; the field exists so a caller
	 * can tell detectors apart once there is more than one.
	 */
	source: 'face';
	/**
	 * The individual detections, for debugging and for callers that want to
	 * weight them differently.
	 */
	detections: Detection[];
}

/**
 * Options for the detector.
 */
export interface DetectSubjectOptions {
	/**
	 * Base URL that the ONNX Runtime WebAssembly binaries and the detection
	 * model are served from. Required, because a WordPress install serves them
	 * from its own plugin directory rather than from a CDN.
	 */
	assetsUrl: string;
	/**
	 * Detections scoring below this are discarded. Defaults to 0.7.
	 */
	minConfidence?: number;
	/**
	 * Cancels the work. Decoding and inference both check it.
	 */
	signal?: AbortSignal;
}
