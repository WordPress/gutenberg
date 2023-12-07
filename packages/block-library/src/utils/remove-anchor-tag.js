/**
 * Removes anchor tags from a string.
 *
 * @param {string} value The value to remove anchor tags from.
 *
 * @return {string} The value with anchor tags removed.
 */
export default function removeAnchorTag( value ) {
	return value.replace( /<\/?a[^>]*>/g, '' );
}
