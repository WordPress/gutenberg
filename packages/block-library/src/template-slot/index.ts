import { registerBlockType } from '@wordpress/blocks';
import type { BlockConfiguration } from '@wordpress/blocks';
import { layout as icon } from '@wordpress/icons';
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	save,
};

/*
 * What `initBlock()` does for the blocks written in JavaScript. The metadata
 * is read from `block.json`, whose values TypeScript types more loosely than a
 * block configuration does.
 */
export const init = () =>
	registerBlockType( metadata as unknown as BlockConfiguration, settings );
