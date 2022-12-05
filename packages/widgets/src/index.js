/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import * as legacyWidget from './blocks/legacy-widget';
import * as widgetGroup from './blocks/widget-group';

export * from './components';
export * from './utils';

/**
 * Registers the Legacy Widget block.
 *
 * Note that for the block to be useful, any scripts required by a widget must
 * be loaded into the page.
 *
 * @param {Object} settings Block settings.
 * @see https://developer.wordpress.org/block-editor/how-to-guides/widgets/legacy-widget-block/
 */
export function registerLegacyWidgetBlock( settings = {} ) {
	const { metadata, settings: defaultSettings, name } = legacyWidget;
	registerBlockType(
		{ name, ...metadata },
		{ ...defaultSettings, ...settings }
	);
}

/**
 * Registers the Widget Group block.
 */
export function registerWidgetGroupBlock() {
	const { metadata, settings, name } = widgetGroup;
	registerBlockType( { name, ...metadata }, settings );
}

export { default as registerLegacyWidgetVariations } from './register-legacy-widget-variations';
