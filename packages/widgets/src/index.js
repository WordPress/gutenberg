/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import * as widgetGroup from './blocks/widget-group';

export * from './components';
export * from './utils';

/**
 * Registers the Legacy Widget block.
 *
 * Note that for the block to be useful, any scripts required by a widget must
 * be loaded into the page.
 *
 * @deprecated since 6.3.0. Use wp.blockLibrary.registerCoreBlocks instead.
 *
 * @see https://developer.wordpress.org/block-editor/how-to-guides/widgets/legacy-widget-block/
 */
export function registerLegacyWidgetBlock() {
	deprecated( 'registerLegacyWidgetBlock', {
		alternative: 'wp.blockLibrary.registerCoreBlocks',
		since: '6.3',
	} );
}

/**
 * Registers the Widget Group block.
 *
 * @param {Object} supports Block support settings.
 */
export function registerWidgetGroupBlock( supports = {} ) {
	const { metadata, settings, name } = widgetGroup;
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

export { default as registerLegacyWidgetVariations } from './register-legacy-widget-variations';
