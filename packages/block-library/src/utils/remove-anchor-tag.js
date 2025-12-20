/**
 * Removes anchor tags from a string.
 *
 * @param {string} value The value to remove anchor tags from.
 *
 * @return {string} The value with anchor tags removed.
 */
export default function removeAnchorTag( value ) {
	// To do: Refactor this to use rich text's removeFormat instead.
	return value.toString().replace( /<\/?a[^>]*>/g, '' );
}
