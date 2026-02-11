/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import deprecated from '@wordpress/deprecated';

/**
 * Filters registered block settings, adding a `label` callback if one does not already exist.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addLabelCallback( settings ) {
	// If blocks provide their own label callback, do not override it.
	const hasLabel = settings.label || settings.__experimentalLabel;
	if ( hasLabel ) {
		if ( settings.__experimentalLabel && ! settings.label ) {
			deprecated( '__experimentalLabel block type property', {
				since: '6.12',
				version: '7.0',
				alternative: 'label',
				hint: 'Update your block registration to use the stable `label` property.',
			} );
		}
		return settings;
	}

	const supportsBlockNaming = hasBlockSupport(
		settings,
		'renaming',
		true // default value
	);

	// Check whether block metadata is supported before using it.
	if ( supportsBlockNaming ) {
		settings.label = defaultBlockLabelCallback;
	}

	return settings;
}

/**
 * Default label callback for blocks that support renaming.
 * Uses metadata.name for list-view and breadcrumb contexts.
 *
 * @param {Object} attributes        Block attributes.
 * @param {Object} options           Options object.
 * @param {string} [options.context] The context for the label (e.g. 'list-view', 'breadcrumb').
 * @return {string|undefined} The label or undefined.
 */
function defaultBlockLabelCallback( attributes, { context } ) {
	const { metadata } = attributes;

	// In the list view and breadcrumb, use the block's name attribute as the label.
	if (
		( context === 'list-view' || context === 'breadcrumb' ) &&
		metadata?.name
	) {
		return metadata.name;
	}
}

addFilter(
	'blocks.registerBlockType',
	'core/metadata/addLabelCallback',
	addLabelCallback
);
