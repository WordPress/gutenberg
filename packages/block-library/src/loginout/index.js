/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { login as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: _x( 'Login/out', 'block title' ),
	description: __( 'Show login & logout links.' ),
	icon,
	keywords: [ __( 'login' ), __( 'logout' ), __( 'form' ) ],
	edit,
};
