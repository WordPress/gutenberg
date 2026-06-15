/**
 * WordPress dependencies
 */
import { commentReplyLink as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import deprecated from './deprecated';

const { name } = metadata;
export { metadata, name };

export const settings = {
	edit,
	icon,
	deprecated,
	example: {},
};

export const init = () => initBlock( { name, metadata, settings } );
