/**
 * Utility function to extract raw content from either a string or an object
 * containing raw and rendered properties.
 *
 * This handles the inconsistency in WordPress REST API responses where
 * some fields like caption and description can be either:
 * - A simple string
 * - An object with { raw: string, rendered: string }
 *
 * @param content - The content to extract raw value from
 * @return The raw content string, or empty string if content is falsy
 */
export function getRawContent(
	content: string | { raw: string; rendered: string } | undefined | null
): string {
	if ( ! content ) {
		return '';
	}

	// If it's a string, return it directly
	if ( typeof content === 'string' ) {
		return content;
	}

	// If it's an object with raw property, return the raw value
	if ( typeof content === 'object' && 'raw' in content ) {
		return content.raw || '';
	}

	// Fallback to empty string
	return '';
}
