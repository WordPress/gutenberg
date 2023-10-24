/**
 * WordPress dependencies
 */
import { commentReplyLink as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import lazyLoad from '../utils/lazy-load';
import initBlock from '../utils/init-block';
import metadata from './block.json';

const { name } = metadata;
export { metadata, name };

export const settings = {
	edit: lazyLoad( () =>
		import( /* webpackChunkName: "comment-reply-link/editor" */ './edit' )
	),
	icon,
};

export const init = () => initBlock( { name, metadata, settings } );
