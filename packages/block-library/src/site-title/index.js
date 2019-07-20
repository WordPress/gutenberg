/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import icon from './icon';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Site Title' ),
	description: __( 'The name of the site visitors will see.' ),
	edit,
	icon,
};
