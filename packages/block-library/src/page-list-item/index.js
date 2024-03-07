/**
 * WordPress dependencies
 */
import { page as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	__experimentalLabel: ( { label } ) => label,
	icon,
	example: {},
	lazyEdit: () =>
		import( /* webpackChunkName: "page-list-item/editor" */ './edit' ),
};

export const init = () => initBlock( { name, metadata, settings } );
