/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { quote as icon } from '@wordpress/icons';

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
	title: __( 'Quote' ),
	description: __(
		'Give quoted text visual emphasis. "In quoting others, we cite ourselves." — Julio Cortázar'
	),
	icon,
	keywords: [ __( 'blockquote' ), __( 'cite' ) ],
	example: {
		attributes: {
			value:
				'<p>' + __( 'In quoting others, we cite ourselves.' ) + '</p>',
			citation: 'Julio Cortázar',
			className: 'is-style-large',
		},
	},
	styles: [
		{
			name: 'default',
			label: _x( 'Default', 'block style' ),
			isDefault: true,
		},
		{ name: 'large', label: _x( 'Large', 'block style' ) },
	],
	transforms,
	edit,
	save,
	merge( attributes, { value, citation } ) {
		// Quote citations cannot be merged. Pick the second one unless it's
		// empty.
		if ( ! citation ) {
			citation = attributes.citation;
		}

		if ( ! value || value === '<p></p>' ) {
			return {
				...attributes,
				citation,
			};
		}

		return {
			...attributes,
			value: attributes.value + value,
			citation,
		};
	},
	deprecated,
};
