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
 * @param {Object} supports Block support settings.
 * @see https://developer.wordpress.org/block-editor/how-to-guides/widgets/legacy-widget-block/
 */
export function registerLegacyWidgetBlock( supports = {} ) {
	const { metadata, settings, name } = legacyWidget;
	registerBlockType(
		{ name, ...metadata },
		{
			...settings,
			supports: {
				...settings.supports,
				...supports,
			},
		}
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
