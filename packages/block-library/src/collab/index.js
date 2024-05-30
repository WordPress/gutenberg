/**
 * WordPress dependencies
 */
import { commentContent as icon } from '@wordpress/icons';
import { registerFormatType } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import { formatName, format } from './format';

const { name } = metadata;

export { metadata, name };

registerFormatType( formatName, format );

export const settings = {
	icon,
	edit: () => {},
};

export const init = () => initBlock({ name, metadata, settings });
