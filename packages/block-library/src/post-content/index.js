/**
 * WordPress dependencies
 */
import { postContent as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	lazyEdit: () =>
		import( /* webpackChunkName: "post-content/editor" */ './edit' ),
};

export const init = () => initBlock( { name, metadata, settings } );
