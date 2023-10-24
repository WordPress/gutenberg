/**
 * WordPress dependencies
 */
import { mapMarker as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import lazyLoad from '../utils/lazy-load';
import initBlock from '../utils/init-block';
import metadata from './block.json';

import deprecated from './deprecated';
import transforms from './transforms';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	example: {},
	edit: lazyLoad( () =>
		import( /* webpackChunkName: "site-title/editor" */ './edit' )
	),
	transforms,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
