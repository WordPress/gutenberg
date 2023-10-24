/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { home } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import lazyLoad from '../utils/lazy-load';
import initBlock from '../utils/init-block';
import metadata from './block.json';

import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: home,

	edit: lazyLoad( () =>
		import( /* webpackChunkName: "home-link/editor" */ './edit' )
	),

	save,

	example: {
		attributes: {
			label: _x( 'Home Link', 'block example' ),
		},
	},
};

export const init = () => initBlock( { name, metadata, settings } );
