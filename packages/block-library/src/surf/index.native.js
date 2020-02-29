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

// Up until now, our implementation has been mobile only.
// We can implement this block for web, and share this index file as index.js

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Surf' ),
	description: __( 'Add surf conditions.' ),
	edit,
	save,
	icon: <Dashicon icon="palmtree" />,
};