/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { share as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import variations from './variations';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Social Icon' ),
	parent: [ 'core/social-links' ],
	supports: {
		reusable: false,
		html: false,
		lightBlockWrapper: true,
	},
	icon,
	edit,
	description: __(
		'Display an icon linking to a social media profile or website.'
	),
	variations,
};
