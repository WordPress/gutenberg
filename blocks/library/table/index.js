/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import TableBlock from './table-block';

export const name = 'core/table';

export const settings = {
	title: __( 'Table' ),
	description: __( 'Tables. Best used for tabular data.' ),
	icon: 'editor-table',
	category: 'formatting',

	attributes: {
		content: {
			type: 'array',
			source: 'children',
			selector: 'table',
			default: [
				<tbody key="1">
					<tr><td><br /></td><td><br /></td></tr>
					<tr><td><br /></td><td><br /></td></tr>
				</tbody>,
			],
		},
	},

	supports: {
		align: true,
	},

	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: ( node ) => node.nodeName === 'TABLE',
			},
		],
	},

	edit( { attributes, setAttributes, isSelected, className } ) {
		const { content } = attributes;

		return (
			<TableBlock
				onChange={ ( nextContent ) => {
					setAttributes( { content: nextContent } );
				} }
				content={ content }
				className={ className }
				isSelected={ isSelected }
			/>
		);
	},

	save( { attributes } ) {
		const { content } = attributes;
		return (
			<table>
				{ content }
			</table>
		);
	},
};
