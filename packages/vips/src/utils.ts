/**
 * Determines whether a given file type supports a quality setting,
 *
 * @todo Make this smarter.
 *
 * @param type Mime type.
 * @return Whether the file supports a quality setting.
 */
export function supportsQuality(
	type: string
): type is 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' {
	return [ 'image/jpeg', 'image/png', 'image/webp', 'image/avif' ].includes(
		type
	);
}

/**
 * Determines whether a given file type supports animation,
 *
 * @todo Make this smarter.
 *
 * @param type Mime type.
 * @return Whether the file supports animation.
 */
export function supportsAnimation(
	type: string
): type is 'image/webp' | 'image/gif' {
	return [ 'image/webp', 'image/gif' ].includes( type );
}

/**
 * Determines whether a given file type supports interlaced/progressive output.
 *
 * @todo Make this smarter.
 *
 * @param type Mime type.
 * @return Whether the file supports interlaced/progressive output.
 */
export function supportsInterlace(
	type: string
): type is 'image/jpeg' | 'image/gif' | 'image/png' {
	return [ 'image/jpeg', 'image/gif', 'image/png' ].includes( type );
}
