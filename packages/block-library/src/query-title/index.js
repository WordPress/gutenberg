/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { archiveTitle as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import variations from './variations';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Query Title' ),
	description: __( 'Display the query title.' ),
	icon,
	edit,
	variations,
};
