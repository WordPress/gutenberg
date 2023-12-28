/**
 * WordPress dependencies
 */
import { rss as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			feedURL: 'https://wordpress.org',
		},
	},
	edit,
};

export const init = () => initBlock( { name, metadata, settings } );
