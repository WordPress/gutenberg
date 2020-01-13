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

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Button' ),
	description: __( 'Prompt visitors to take action with a button-style link.' ),
	icon,
	keywords: [ __( 'link' ) ],
	example: {
		attributes: {
			className: 'is-style-fill',
			backgroundColor: 'vivid-green-cyan',
			text: __( 'Call to Action' ),
		},
	},
	supports: {
		align: true,
		alignWide: false,
	},
	parent: [ 'core/buttons' ],
	styles: [
		{ name: 'fill', label: __( 'Fill' ), isDefault: true },
		{ name: 'outline', label: __( 'Outline' ) },
	],
	edit,
	save,
	deprecated,
};
