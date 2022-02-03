/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { blockTable as icon } from '@wordpress/icons';

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
							content: '5.9',
							tag: 'td',
						},
						{
							content: 'Joséphine Baker',
							tag: 'td',
						},
						{
							content: __( 'January 25, 2022' ),
							tag: 'td',
						},
					],
				},
				{
					cells: [
						{
							content: '5.8',
							tag: 'td',
						},
						{
							content: 'Art Tatum',
							tag: 'td',
						},
						{
							content: __( 'July 20, 2021' ),
							tag: 'td',
						},
					],
				},
				{
					cells: [
						{
							content: '5.7',
							tag: 'td',
						},
						{
							content: 'Esperanza Spalding',
							tag: 'td',
						},
						{
							content: __( 'March 9, 2021' ),
							tag: 'td',
						},
					],
				},
			],
		},
	},
	transforms,
	edit,
	save,
	deprecated,
};
