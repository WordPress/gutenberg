/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';

// Note: Since we don't have save.native.js, save is imported from save.js

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Surf' ),
	description: __( 'Add surf conditions.' ),
	edit,
	save,
	icon: <Dashicon icon="palmtree" />,
};