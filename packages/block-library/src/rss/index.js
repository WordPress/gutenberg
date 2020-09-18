/**
 * WordPress dependencies
 */
import { rss as icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'RSS' ),
	description: __( 'Display entries from any RSS or Atom feed.' ),
	icon,
	keywords: [ __( 'atom' ), __( 'feed' ) ],
	example: {
		attributes: {
			feedURL: 'https://wordpress.org',
		},
	},
	edit,
};
