/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Audio' ),
	description: __( 'Embed a simple audio player.' ),
	keywords: [ __( 'music' ), __( 'sound' ), __( 'podcast' ), __( 'recording' ) ],
	icon,
	transforms,
	deprecated,
	supports: {
		align: true,
	},
	edit,
	save,
};
