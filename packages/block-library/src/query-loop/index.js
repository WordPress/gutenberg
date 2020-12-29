/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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
	title: __( 'Query Loop' ),
	icon: loop,
	edit,
	save,
	parent: [ 'core/query' ],
};
