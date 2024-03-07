/**
 * WordPress dependencies
 */
import { layout } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';

import save from './save';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon: layout,
	lazyEdit: () =>
		import( /* webpackChunkName: "post-template/editor" */ './edit' ),
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
