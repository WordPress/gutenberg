/**
 * WordPress dependencies
 */
import { formatListNumbered as icon } from '@wordpress/icons';
import { registerFormatType } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import { formatName, format } from './format';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	edit,
};

export const init = () => {
	// Would be good to remove the format if the block is unregistered.
	registerFormatType( formatName, format );
	initBlock( { name, metadata, settings } );
};
