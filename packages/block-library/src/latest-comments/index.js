/**
 * WordPress dependencies
 */
import { comment as icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Latest Comments' ),
	description: __( 'Display a list of your most recent comments.' ),
	icon,
	keywords: [ __( 'recent comments' ) ],
	example: {},
	edit,
};
