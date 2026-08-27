/**
 * Unique identifier for a media item being processed.
 */
export type ItemId = string;

/**
 * A single temporal frame (HEVC access unit) of an image sequence, as
 * demuxed on the main thread and passed across the worker boundary.
 */
export interface HeicSequenceSampleInput {
	/** Raw HEVC bitstream for this frame. */
	data: Uint8Array;
	/** Whether this frame is a sync sample (keyframe). */
	isSync: boolean;
	/** Presentation timestamp in microseconds. */
	timestampUs: number;
	/** Frame duration in microseconds. */
	durationUs: number;
}

/**
 * Demuxed HEIC/HEIF image sequence ready to decode and re-encode to video.
 */
export interface HeicSequenceInput {
	/** HEVC codec string for VideoDecoder. */
	codecString: string;
	/** HEVCDecoderConfigurationRecord bytes. */
	description: Uint8Array;
	/** Coded frame width in pixels. */
	codedWidth: number;
	/** Coded frame height in pixels. */
	codedHeight: number;
	/** Display rotation in degrees clockwise (0, 90, 180, 270). */
	rotation: number;
	/** Temporal frames in decode order. */
	samples: HeicSequenceSampleInput[];
}
