/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { table as icon } from '@wordpress/icons';

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
	title: __( 'Table' ),
	description: __( 'Insert a table — perfect for sharing charts and data.' ),
	icon,
	example: {
		attributes: {
			head: [
				{
					cells: [
						{
							content: __( 'Version' ),
							tag: 'th',
						},
						{
							content: __( 'Jazz Musician' ),
							tag: 'th',
						},
						{
							content: __( 'Release Date' ),
							tag: 'th',
						},
					],
				},
			],
			body: [
				{
					cells: [
						{
							content: '5.2',
							tag: 'td',
						},
						{
							content: 'Jaco Pastorius',
							tag: 'td',
						},
						{
							content: __( 'May 7, 2019' ),
							tag: 'td',
						},
					],
				},
				{
					cells: [
						{
							content: '5.1',
							tag: 'td',
						},
						{
							content: 'Betty Carter',
							tag: 'td',
						},
						{
							content: __( 'February 21, 2019' ),
							tag: 'td',
						},
					],
				},
				{
					cells: [
						{
							content: '5.0',
							tag: 'td',
						},
						{
							content: 'Bebo Valdés',
							tag: 'td',
						},
						{
							content: __( 'December 6, 2018' ),
							tag: 'td',
						},
					],
				},
			],
		},
	},
	styles: [
		{
			name: 'regular',
			label: _x( 'Default', 'block style' ),
			isDefault: true,
		},
		{ name: 'stripes', label: __( 'Stripes' ) },
	],
	supports: {
		align: true,
	},
	transforms,
	edit,
	save,
	deprecated,
};
