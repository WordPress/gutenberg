/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

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
			content: sprintf(
				__( '// A "block" is the abstract term used%1$s// to describe units of markup that%1$s// when composed together, form the%1$s// content or layout of a page.%1$sregisterBlockType( name, settings );' ),
				'\n'
			),
		},
	},
	supports: {
		html: false,
	},
	transforms,
	edit,
	save,
};
