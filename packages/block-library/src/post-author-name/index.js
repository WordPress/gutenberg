/**
 * WordPress dependencies
 */
import { postAuthor as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import lazyLoad from '../utils/lazy-load';
import initBlock from '../utils/init-block';
import metadata from './block.json';

import transforms from './transforms';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	transforms,
	edit: lazyLoad( () =>
		import( /* webpackChunkName: "post-author-name/editor" */ './edit' )
	),
};

export const init = () => initBlock( { name, metadata, settings } );
