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
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Code' ),
	description: __( 'Display code snippets that respect your spacing and tabs.' ),
	icon,
	example: {
		attributes: {
			content: __( '// A "block" is the abstract term used' ) + '\n' +
			__( '// to describe units of markup that,' ) + '\n' +
			__( '// when composed together, form the' ) + '\n' +
			__( '// content or layout of a page.' ) + '\n' +
			__( 'registerBlockType( name, settings );' ),
		},
	},
	supports: {
		html: false,
	},
	transforms,
	edit,
	save,
};
