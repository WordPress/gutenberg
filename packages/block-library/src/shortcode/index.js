/**
 * WordPress dependencies
 */
import { shortcode as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import lazyLoad from '../utils/lazy-load';
import initBlock from '../utils/init-block';
import save from './save';
import transforms from './transforms';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	transforms,
	edit: lazyLoad( () =>
		import( /* webpackChunkName: "shortcode/editor" */ './edit' )
	),
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
