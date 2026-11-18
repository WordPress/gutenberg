/**
 * Removes anchor tags from a string.
 *
 * @param value The value to remove anchor tags from.
 *
 * @return The value with anchor tags removed.
 */
export default function removeAnchorTag( value: string ): string {
	// To do: Refactor this to use rich text's removeFormat instead.
	return value.toString().replace( /<\/?a[^>]*>/g, '' );
}
