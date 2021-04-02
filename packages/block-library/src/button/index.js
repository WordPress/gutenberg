/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { button as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'Button', 'block title' ),
	description: __(
		'Prompt visitors to take action with a button-style link.'
	),
	icon,
	keywords: [ __( 'link' ) ],
	example: {
		attributes: {
			className: 'is-style-fill',
			backgroundColor: 'vivid-green-cyan',
			text: __( 'Call to Action' ),
		},
	},
	styles: [
		{ name: 'fill', label: _x( 'Fill', 'block style' ), isDefault: true },
		{ name: 'outline', label: _x( 'Outline', 'block style' ) },
	],
	edit,
	save,
	deprecated,
	merge: ( a, { text = '' } ) => ( {
		...a,
		text: ( a.text || '' ) + text,
	} ),
};
