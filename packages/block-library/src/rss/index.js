/**
 * WordPress dependencies
 */
import { rss as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import lazyLoad from '../utils/lazy-load';
import initBlock from '../utils/init-block';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			feedURL: 'https://wordpress.org',
		},
	},
	edit: lazyLoad( () =>
		import( /* webpackChunkName: "rss/editor" */ './edit' )
	),
};

export const init = () => initBlock( { name, metadata, settings } );
