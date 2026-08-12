import { __ } from '@wordpress/i18n';
import { blockTable as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		innerBlocks: [
			// Header row
			{
				name: 'core/table-v2-cell',
				attributes: {
					content: __( 'Version' ),
					tag: 'th',
					section: 'head',
					row: 0,
					column: 0,
					scope: 'col',
				},
			},
			{
				name: 'core/table-v2-cell',
				attributes: {
					content: __( 'Jazz Musician' ),
					tag: 'th',
					section: 'head',
					row: 0,
					column: 1,
					scope: 'col',
				},
			},
			{
				name: 'core/table-v2-cell',
				attributes: {
					content: __( 'Release Date' ),
					tag: 'th',
					section: 'head',
					row: 0,
					column: 2,
					scope: 'col',
				},
			},
			// Body rows
			{
				name: 'core/table-v2-cell',
				attributes: {
					content: '5.2',
					tag: 'td',
					section: 'body',
					row: 0,
					column: 0,
				},
			},
			{
				name: 'core/table-v2-cell',
				attributes: {
					content: __( 'Jaco Pastorius' ),
					tag: 'td',
					section: 'body',
					row: 0,
					column: 1,
				},
			},
			{
				name: 'core/table-v2-cell',
				attributes: {
					content: __( 'May 7, 2019' ),
					tag: 'td',
					section: 'body',
					row: 0,
					column: 2,
				},
			},
			{
				name: 'core/table-v2-cell',
				attributes: {
					content: '5.1',
					tag: 'td',
					section: 'body',
					row: 1,
					column: 0,
				},
			},
			{
				name: 'core/table-v2-cell',
				attributes: {
					content: __( 'Betty Carter' ),
					tag: 'td',
					section: 'body',
					row: 1,
					column: 1,
				},
			},
			{
				name: 'core/table-v2-cell',
				attributes: {
					content: __( 'February 21, 2019' ),
					tag: 'td',
					section: 'body',
					row: 1,
					column: 2,
				},
			},
		],
		viewportWidth: 450,
	},
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
