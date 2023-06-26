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

// Would be good to remove the format and HoR if the block is unregistered.
registerFormatType( formatName, format );

export const init = () => {
	initBlock( { name, metadata, settings } );
};
