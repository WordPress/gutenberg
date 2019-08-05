/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Social link' ),
	parent: [ 'core/social-links' ],
	icon: 'share',
	description: __( 'A social media or external link.' ),
	supports: {
		inserter: false,
		reusable: false,
		html: false,
	},
	edit,
	save,
};

