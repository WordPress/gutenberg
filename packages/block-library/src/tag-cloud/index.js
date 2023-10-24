/**
 * WordPress dependencies
 */
import { tag as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import lazyLoad from '../utils/lazy-load';
import initBlock from '../utils/init-block';
import transforms from './transforms';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {},
	edit: lazyLoad( () =>
		import( /* webpackChunkName: "tag-cloud/editor" */ './edit' )
	),
	transforms,
};

export const init = () => initBlock( { name, metadata, settings } );
