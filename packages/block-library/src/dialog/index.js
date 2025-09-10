/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal Dependencies
 */
import edit from './edit';
import save from './save';
import icon from './icon';
import deprecated from './deprecated';
import metadata from './block.json';

const { name } = metadata;

const settings = {
	icon,
	edit,
	save,
	deprecated,
};

registerBlockType(name, { ...metadata, ...settings });
