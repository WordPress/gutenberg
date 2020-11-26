/**
 * Original function to determine default number of columns from a block's
 * attributes.
 *
 * Used in deprecations: v1-6.
 *
 * @param  {Object} attributes Block attributes.
 * @return {number}            Default number of columns for the gallery.
 */
export function defaultColumnsNumber( attributes ) {
	return Math.min( 3, attributes.images.length );
}
