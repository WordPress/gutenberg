/**
 * WordPress dependencies
 */
import { postExcerpt as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';

import transforms from './transforms';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	transforms,
	lazyEdit: () =>
		import( /* webpackChunkName: "post-excerpt/editor" */ './edit' ),
};

export const init = () => initBlock( { name, metadata, settings } );
