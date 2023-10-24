/**
 * WordPress dependencies
 */
import { postDate as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import lazyLoad from '../utils/lazy-load';
import initBlock from '../utils/init-block';
import metadata from './block.json';

import deprecated from './deprecated';
import variations from './variations';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit: lazyLoad( () =>
		import( /* webpackChunkName: "post-date/editor" */ './edit' )
	),
	deprecated,
	variations,
};

export const init = () => initBlock( { name, metadata, settings } );
