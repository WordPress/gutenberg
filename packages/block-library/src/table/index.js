/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { getPhrasingContentSchema } from '@wordpress/blocks';
import { RichText, getColorClassName } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';

const tableContentPasteSchema = {
	tr: {
		allowEmpty: true,
		children: {
			th: {
				allowEmpty: true,
				children: getPhrasingContentSchema(),
			},
			td: {
				allowEmpty: true,
				children: getPhrasingContentSchema(),
			},
		},
	},
};

const tablePasteSchema = {
	table: {
		children: {
			thead: {
				allowEmpty: true,
				children: tableContentPasteSchema,
			},
			tfoot: {
				allowEmpty: true,
				children: tableContentPasteSchema,
			},
			tbody: {
				allowEmpty: true,
				children: tableContentPasteSchema,
			},
		},
	},
};

function getTableSectionAttributeSchema( section ) {
	return {
		type: 'array',
		default: [],
		source: 'query',
		selector: `t${ section } tr`,
		query: {
			cells: {
				type: 'array',
				default: [],
				source: 'query',
				selector: 'td,th',
				query: {
					content: {
						type: 'string',
						source: 'html',
					},
					tag: {
						type: 'string',
						default: 'td',
						source: 'tag',
					},
				},
			},
		},
	};
}

export const name = 'core/table';

export const settings = {
	title: __( 'Table' ),
	description: __( 'Insert a table — perfect for sharing charts and data.' ),
	icon,
	category: 'formatting',

	attributes: {
		hasFixedLayout: {
			type: 'boolean',
			default: false,
		},
		backgroundColor: {
			type: 'string',
		},
		head: getTableSectionAttributeSchema( 'head' ),
		body: getTableSectionAttributeSchema( 'body' ),
		foot: getTableSectionAttributeSchema( 'foot' ),
	},

	styles: [
		{ name: 'regular', label: _x( 'Default', 'block style' ), isDefault: true },
		{ name: 'stripes', label: __( 'Stripes' ) },
	],

	supports: {
		align: true,
	},

	transforms: {
		from: [
			{
				type: 'raw',
				selector: 'table',
				schema: tablePasteSchema,
			},
		],
	},

	edit,

	save( { attributes } ) {
		const {
			hasFixedLayout,
			head,
			body,
			foot,
			backgroundColor,
		} = attributes;
		const isEmpty = ! head.length && ! body.length && ! foot.length;

		if ( isEmpty ) {
			return null;
		}

		const backgroundClass = getColorClassName( 'background-color', backgroundColor );

		const classes = classnames( backgroundClass, {
			'has-fixed-layout': hasFixedLayout,
			'has-background': !! backgroundClass,
		} );

		const Section = ( { type, rows } ) => {
			if ( ! rows.length ) {
				return null;
			}

			const Tag = `t${ type }`;

			return (
				<Tag>
					{ rows.map( ( { cells }, rowIndex ) => (
						<tr key={ rowIndex }>
							{ cells.map( ( { content, tag }, cellIndex ) =>
								<RichText.Content
									tagName={ tag }
									value={ content }
									key={ cellIndex }
								/>
							) }
						</tr>
					) ) }
				</Tag>
			);
		};

		return (
			<table className={ classes }>
				<Section type="head" rows={ head } />
				<Section type="body" rows={ body } />
				<Section type="foot" rows={ foot } />
			</table>
		);
	},
};
