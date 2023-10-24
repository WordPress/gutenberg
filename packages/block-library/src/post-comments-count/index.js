/**
 * WordPress dependencies
 */
import { postCommentsCount as icon } from '@wordpress/icons';

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
	edit: lazyLoad( () =>
		import( /* webpackChunkName: "post-comments-count/editor" */ './edit' )
	),
};

export const init = () => initBlock( { name, metadata, settings } );
