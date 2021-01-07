/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { loop } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: _x( 'Query Loop', 'block title' ),
	icon: loop,
	edit,
	save,
	parent: [ 'core/query' ],
};
