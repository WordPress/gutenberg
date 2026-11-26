import { registerBlockType, type BlockSupports } from '@wordpress/blocks';
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
 * @param supports Block support settings.
 * @see https://developer.wordpress.org/block-editor/how-to-guides/widgets/legacy-widget-block/
 */
export function registerLegacyWidgetBlock( supports: BlockSupports = {} ) {
	const { metadata, settings, name } = legacyWidget;
	registerBlockType(
		{ ...metadata, name },
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
 *
 * @param supports Block support settings.
 */
export function registerWidgetGroupBlock( supports: BlockSupports = {} ) {
	const { metadata, settings, name } = widgetGroup;
	registerBlockType(
		{ ...metadata, name },
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
