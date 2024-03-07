/**
 * WordPress dependencies
 */
import { column as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import deprecated from './deprecated';

import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	lazyEdit: () => import( /* webpackChunkName: "column/editor" */ './edit' ),
	save,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
