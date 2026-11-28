import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import type { BlockMetadata } from './types';

/**
 * Filters registered block settings, adding an `__experimentalLabel` callback if one does not already exist.
 *
 * @param settings Original block settings.
 *
 * @return Filtered block settings.
 */
export function addLabelCallback( settings: BlockType ): BlockType {
	// If blocks provide their own label callback, do not override it.
	if ( settings.__experimentalLabel ) {
		return settings;
	}

	const supportsBlockNaming = hasBlockSupport(
		settings,
		'renaming',
		true // default value
	);

	// Check whether block metadata is supported before using it.
	if ( supportsBlockNaming ) {
		settings.__experimentalLabel = (
			attributes,
			{ context }
		): string | void => {
			// Block attributes are not validated against a schema.
			const { metadata } = attributes as { metadata?: BlockMetadata };

			// In the list view and breadcrumb, use the block's name attribute as the label.
			if (
				( context === 'list-view' || context === 'breadcrumb' ) &&
				metadata?.name
			) {
				return metadata.name;
			}
		};
	}

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/metadata/addLabelCallback',
	addLabelCallback
);
