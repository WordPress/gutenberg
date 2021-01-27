/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { audio as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'Audio', 'block title' ),
	description: __( 'Embed a simple audio player.' ),
	keywords: [
		__( 'music' ),
		__( 'sound' ),
		__( 'podcast' ),
		__( 'recording' ),
	],
	icon,
	transforms,
	deprecated,
	edit,
	save,
};
