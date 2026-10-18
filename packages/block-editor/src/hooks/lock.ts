import { addFilter } from '@wordpress/hooks';
import type { BlockType } from '@wordpress/blocks';

/**
 * Filters registered block settings, extending attributes to include `lock`.
 *
 * @param settings Original block settings.
 *
 * @return Filtered block settings.
 */
export function addAttribute( settings: BlockType ): BlockType {
	// Allow blocks to specify their own attribute definition with default values if needed.
	if ( 'type' in ( settings.attributes?.lock ?? {} ) ) {
		return settings;
	}
	// Gracefully handle if settings.attributes is undefined.
	settings.attributes = {
		...settings.attributes,
		lock: {
			type: 'object',
		},
	};

	return settings;
}

addFilter( 'blocks.registerBlockType', 'core/lock/addAttribute', addAttribute );
