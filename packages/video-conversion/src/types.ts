/**
 * Unique identifier for a media item being processed.
 */
export type ItemId = string;

/**
 * Metadata read from an input video file, used to decide whether the video is
 * already web-safe or needs transcoding.
 */
export interface VideoMetadata {
	/** The video codec of the primary track (e.g. 'avc', 'vp9'), or null. */
	codec: string | null;
	/** Display width in pixels. */
	width: number;
	/** Display height in pixels. */
	height: number;
	/** Average bitrate in bits per second (0 if it could not be computed). */
	bitrate: number;
	/** Duration in seconds (0 if it could not be computed). */
	duration: number;
}

/**
 * Options controlling video transcoding.
 */
export interface TranscodeVideoOptions {
	/** Maximum dimension (longest edge) in pixels; downscales past it. */
	maxDimensions?: number;
	/** Target output frame rate cap in hertz. */
	frameRate?: number;
	/** Target output bitrate in bits per second. */
	bitrate?: number;
}
