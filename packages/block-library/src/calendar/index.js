/**
 * WordPress dependencies
 */
import { calendar as icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Calendar' ),
	description: __( 'A calendar of your site’s posts.' ),
	icon,
	keywords: [ __( 'posts' ), __( 'archive' ) ],
	supports: {
		align: true,
	},
	example: {},
	edit,
	transforms,
};
