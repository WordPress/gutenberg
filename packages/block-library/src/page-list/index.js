/**
 * WordPress dependencies
 */
import { pages } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: pages,
	example: {},
	lazyEdit: () =>
		import( /* webpackChunkName: "page-list/editor" */ './edit' ),
};

export const init = () => initBlock( { name, metadata, settings } );
