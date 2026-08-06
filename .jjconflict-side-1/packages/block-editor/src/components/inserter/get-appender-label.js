/**
 * Returns the appender label for a default block if available.
 *
 * This function calls the block's __experimentalLabel function with the 'appender'
 * context to get a custom label for the inserter button. The block should return
 * the full display label (e.g., "Add page") — consistent with how __experimentalLabel
 * works in other contexts like 'list-view'. The inserter uses the result directly
 * without reformatting.
 *
 * @param {Object} defaultBlock     The default block configuration with name and attributes.
 * @param {Object} defaultBlockType The block type object containing __experimentalLabel.
 * @return {string|null}            The full appender label, or null if not available.
 */
const MAX_APPENDER_LABEL_LENGTH = 50;

export function getAppenderLabel( defaultBlock, defaultBlockType ) {
	if (
		! defaultBlock ||
		! defaultBlock.attributes ||
		! defaultBlockType?.__experimentalLabel
	) {
		return null;
	}

	const result = defaultBlockType.__experimentalLabel(
		defaultBlock.attributes,
		{ context: 'appender' }
	);

	// Only use if it's a string and not too long (safety check)
	if (
		typeof result === 'string' &&
		result.length < MAX_APPENDER_LABEL_LENGTH &&
		result.length > 0
	) {
		return result;
	}

	return null;
}
