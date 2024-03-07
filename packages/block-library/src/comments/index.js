/**
 * WordPress dependencies
 */
import { postComments as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import deprecated from './deprecated';

import save from './save';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	lazyEdit: () =>
		import( /* webpackChunkName: "comments/editor" */ './edit' ),
	save,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
