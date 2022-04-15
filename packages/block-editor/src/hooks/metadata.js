/**
 * External dependencies
 */
import { has } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Filters registered block settings, extending attributes to include `metadata` in blocks declaring section support.
 *
 * @param {Object} blockTypeSettings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addAttribute( blockTypeSettings ) {
	if (
		hasBlockSupport( blockTypeSettings, '__experimentalMetadata', false )
	) {
		// Allow blocks to specify their own metadata attribute definition with default value if needed.
		if ( ! has( blockTypeSettings.attributes, [ 'metadata' ] ) ) {
			blockTypeSettings.attributes = {
				...blockTypeSettings.attributes,
				metadata: {
					type: 'object',
				},
			};
		}
	}
	return blockTypeSettings;
}

addFilter(
	'blocks.registerBlockType',
	'core/metadata/addAttribute',
	addAttribute
);
