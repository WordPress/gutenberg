/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { search as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import variations from './variations';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Search' ),
	description: __( 'Help visitors find your content.' ),
	icon,
	keywords: [ __( 'find' ) ],
	example: {},
	variations,
	edit,
};
