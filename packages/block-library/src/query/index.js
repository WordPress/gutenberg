/**
 * WordPress dependencies
 */
import { loop as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';

import save from './save';
import variations from './variations';
import deprecated from './deprecated';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	lazyEdit: () => import( /* webpackChunkName: "query/editor" */ './edit' ),
	save,
	variations,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
