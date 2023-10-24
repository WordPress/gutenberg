/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { search as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import lazyLoad from '../utils/lazy-load';
import initBlock from '../utils/init-block';
import metadata from './block.json';

import variations from './variations';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: { buttonText: __( 'Search' ), label: __( 'Search' ) },
		viewportWidth: 400,
	},
	variations,
	edit: lazyLoad( () =>
		import( /* webpackChunkName: "search/editor" */ './edit' )
	),
};

export const init = () => initBlock( { name, metadata, settings } );
