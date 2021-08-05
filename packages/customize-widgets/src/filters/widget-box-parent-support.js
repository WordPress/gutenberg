/**
 * WordPress dependencies
 */

import { addFilter } from '@wordpress/hooks';

/**
 * Removes the "parent" property from the Widget Box block
 * so as to allow it to appear in the Widgets Customizer.
 * By default this block is set to appear only as a child
 * of "widget-area" so as to avoid nesting of Widget Boxes.
 * However as the Customizer doesn't utilise the `widget-area`
 * block, we must remove the parent setting.
 *
 * @param {Object} settings the block settings.
 * @param {string} name     the name of the block.
 * @return {Object} the new block settings.
 */
function removeWidgetBoxParent( settings, name ) {
	if ( name !== 'core/widget-box' ) {
		return settings;
	}

	// Remove the "parent" property.
	// eslint-disable-next-line no-unused-vars
	const { parent, ...newSettings } = settings;

	return newSettings;
}

addFilter(
	'blocks.registerBlockType',
	'core/customize-widgets/widget-box-no-parent-supports',
	removeWidgetBoxParent
);
