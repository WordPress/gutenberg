/**
 * WordPress dependencies
 */
import { comment as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {},
	lazyEdit: () =>
		import( /* webpackChunkName: "latest-comments/editor" */ './edit' ),
};

export const init = () => initBlock( { name, metadata, settings } );
