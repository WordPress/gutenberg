/**
 * WordPress dependencies
 */
import { share as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import lazyLoad from '../utils/lazy-load';
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	example: {
		innerBlocks: [
			{
				name: 'core/social-link',
				attributes: {
					service: 'wordpress',
					url: 'https://wordpress.org',
				},
			},
			{
				name: 'core/social-link',
				attributes: {
					service: 'facebook',
					url: 'https://www.facebook.com/WordPress/',
				},
			},
			{
				name: 'core/social-link',
				attributes: {
					service: 'twitter',
					url: 'https://twitter.com/WordPress',
				},
			},
		],
	},
	icon,
	edit: lazyLoad( () =>
		import( /* webpackChunkName: "social-links/editor" */ './edit' )
	),
	save,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
