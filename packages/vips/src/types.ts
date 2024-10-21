export type ItemId = string;

export interface ImageSizeCrop {
	width: number;
	height: number;
	crop?:
		| boolean
		| [ 'left' | 'center' | 'right', 'top' | 'center' | 'bottom' ];
}

/**
 * none: Do nothing. Same as low.
 * centre: Just take the centre.
 * entropy: Use an entropy measure
 * attention: Look for features likely to draw human attention.
 * low: Position the crop towards the low coordinate. Same as none.
 * high: Position the crop towards the high coordinate.
 * all: Everything is interesting.
 */
type Interesting =
	| 'none'
	| 'centre'
	| 'entropy'
	| 'attention'
	| 'low'
	| 'high'
	| 'all';

/**
 * none: Don't attach metadata.
 * exif: Keep Exif metadata.
 * xmp: Keep XMP metadata.
 * iptc: Keep IPTC metadata.
 * icc: Keep ICC metadata.
 * other: Keep other metadata (e.g. PNG comments and some TIFF tags).
 * all: Keep all metadata.
 */
type ForeignKeep = 'none' | 'exif' | 'xmp' | 'iptc' | 'icc' | 'other' | 'all';

/**
 * The rendering intent.'absolute' is best for
 * scientific work, 'relative' is usually best for
 * accurate communication with other imaging libraries.
 *
 * perceptual: Perceptual rendering intent.
 * relative: Relative colorimetric rendering intent.
 * saturation: Saturation rendering intent.
 * absolute: Absolute colorimetric rendering intent.
 */
type Intent = 'perceptual' | 'relative' | 'saturation' | 'absolute';

/**
 * How sensitive loaders are to errors, from never stop (very insensitive), to
 * stop on the smallest warning (very sensitive).
 *
 * Each one implies the ones before it, so 'error' implies
 * 'truncated'.
 *
 * none: Never stop.
 * truncated: Stop on image truncated, nothing else.
 * error: Stop on serious error or truncation.
 * warning: Stop on anything, even warnings.
 */
type FailOn = 'none' | 'truncated' | 'error' | 'warning';

/**
 * The type of access an operation has to supply. See vips_tilecache()
 * and #VipsForeign.
 *
 * random: means requests can come in any order.
 *
 * sequential: means requests will be top-to-bottom, but with some
 * amount of buffering behind the read point for small non-local accesses.
 */
type Access = 'random' | 'sequential' | 'sequential-unbuffered';

export interface LoadOptions< T extends string > {
	/**
	 * Number of pages to load, -1 for all.
	 */
	n?: T extends 'image/gif'
		? number
		: T extends 'image/webp'
		? number
		: never;
	/**
	 * Required access pattern for this file.
	 */
	access?: Access;
	/**
	 * Error level to fail on.
	 */
	fail_on?: FailOn;
	/**
	 * Don't use a cached result for this operation.
	 */
	revalidate?: boolean;
}

export interface SaveOptions< T extends string > {
	/**
	 * Quality factor.
	 */
	Q?: T extends 'image/gif' ? never : number;
	/**
	 * Which metadata to retain.
	 */
	keep?: ForeignKeep;
	/**
	 * Generate an interlaced (progressive) JPEG/PNG/GIF.
	 * Do not provide for any other type!
	 */
	interlace?: boolean;
	/**
	 * Enable lossless compression (for WebP).
	 * Do not provide for any other type!
	 */
	lossless?: T extends 'image/gif' ? never : boolean;
	/**
	 * CPU effort / encoding speed.
	 *
	 * While supported by other encoders as well,
	 * it is most relevant for AVIF, as it is slow by default.
	 */
	effort?: number;
}

export interface ThumbnailOptions {
	/**
	 * Options that are passed on to the underlying loader.
	 */
	option_string?: string;
	/**
	 * Size to this height.
	 */
	height?: number;
	/**
	 * Whether to upsize, downsize, both up and
	 * downsize, or force a size (breaks aspect ratio).
	 */
	size?: 'both' | 'up' | 'down' | 'force';
	/**
	 * Don't use orientation tags to rotate image upright.
	 */
	no_rotate?: boolean;
	/**
	 * Reduce to fill target rectangle, then crop.
	 */
	crop?: Interesting;
	/**
	 * Reduce in linear light.
	 */
	linear?: boolean;
	/**
	 * Fallback import profile.
	 */
	import_profile?: string;
	/**
	 * Fallback export profile.
	 */
	export_profile?: string;
	/**
	 * Rendering intent.
	 */
	intent?: Intent;
	/**
	 * Error level to fail on.
	 */
	fail_on?: FailOn;
}
