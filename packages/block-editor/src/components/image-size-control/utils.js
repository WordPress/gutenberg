/**
 * Determine if an image is portrait by height/width.
 *
 * @param {number} height image height.
 * @param {number} width  image width.
 * @return {boolean} is portrait image.
 */
export const isPortrait = ( height, width ) => height > width;

/**
 * Determine the image aspect ratio based on orientation.
 *
 * @param {number} height image height.
 * @param {number} width  image width.
 * @return {number} image aspect ratio as decimal.
 */
export const getImageRatio = ( height, width ) =>
	Number(
		( isPortrait( height, width )
			? height / width
			: width / height
		).toFixed( 3 )
	);

/**
 * Get calculated height or respective width dimension based on image orientation.
 *
 * @param {number}  value    new height or width value.
 * @param {number}  ratio    ratio of the height.
 * @param {boolean} vertical whether or not the image aspect is vertical.
 * @return {number} multiplied or divided value by ratio.
 */
export const getDimensionsByRatio = ( value, ratio, vertical = true ) =>
	Math.round( vertical ? value * ratio : value / ratio );
