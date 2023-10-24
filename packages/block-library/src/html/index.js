/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { html as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import lazyLoad from '../utils/lazy-load';
import initBlock from '../utils/init-block';

import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			content:
				'<marquee>' +
				__( 'Welcome to the wonderful world of blocks…' ) +
				'</marquee>',
		},
	},
	edit: lazyLoad( () =>
		import( /* webpackChunkName: "html/editor" */ './edit' )
	),
	save,
	transforms,
};

export const init = () => initBlock( { name, metadata, settings } );
