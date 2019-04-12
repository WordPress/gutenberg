/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Social Links' ),
	description: __( 'Display a row of icons of your social media accounts.' ),
	icon,
	category: 'layout',
	keywords: [ __( 'link' ) ],
	edit,
	save,
};
