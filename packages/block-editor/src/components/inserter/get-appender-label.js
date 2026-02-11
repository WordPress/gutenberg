/**
 * WordPress dependencies
 */
import { resolveBlockLabelCallback } from '@wordpress/blocks';

/**
 * Returns the appender label for a default block if available.
 *
 * This function calls the block's label function with the 'appender'
 * context to get a custom label for the inserter button. The block should return
 * the full display label (e.g., "Add page") — consistent with how the label
 * property works in other contexts like 'list-view'. The inserter uses the result
 * directly without reformatting.
 *
 * @param {Object} defaultBlock     The default block configuration with name and attributes.
 * @param {Object} defaultBlockType The block type object containing label.
 * @return {string|null}            The full appender label, or null if not available.
 */
export function getAppenderLabel( defaultBlock, defaultBlockType ) {
	const getLabel = resolveBlockLabelCallback( defaultBlockType );

	if ( ! defaultBlock || ! defaultBlock.attributes || ! getLabel ) {
		return null;
	}

	const result = getLabel( defaultBlock.attributes, { context: 'appender' } );

	// Only use if it's a string and not too long (safety check)
	if (
		typeof result === 'string' &&
		result.length < 50 &&
		result.length > 0
	) {
		return result;
	}

	return null;
}
