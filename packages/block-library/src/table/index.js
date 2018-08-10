/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { getPhrasingContentSchema } from '@wordpress/blocks';
import {
	RichText,
	InspectorControls,
} from '@wordpress/editor';

import {
	PanelBody,
	ToggleControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import TableBlock from './table-block';

const tableContentSchema = {
	tr: {
		children: {
			th: {
				children: getPhrasingContentSchema(),
			},
			td: {
				children: getPhrasingContentSchema(),
			},
		},
	},
};

const tableSchema = {
	table: {
		children: {
			thead: {
				children: tableContentSchema,
			},
			tfoot: {
				children: tableContentSchema,
			},
			tbody: {
				children: tableContentSchema,
			},
		},
	},
};

export const name = 'core/table';

export const settings = {
	title: __( 'Table' ),
	description: __( 'Insert a table -- perfect for sharing charts and data.' ),
	icon: <svg version="1" width="24" height="24"><path fill="none" d="M0 0h24v24H0V0z"/><g><path d="M20 3H5L3 5v14l2 2h15l2-2V5l-2-2zm0 2v3H5V5h15zm-5 14h-5v-9h5v9zM5 10h3v9H5v-9zm12 9v-9h3v9h-3z"/></g></svg>,
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
		hasFixedLayout: {
			type: 'boolean',
			default: false,
		},
	},

	supports: {
		align: true,
	},

	transforms: {
		from: [
			{
				type: 'raw',
				selector: 'table',
				schema: tableSchema,
			},
		],
	},

	edit( { attributes, setAttributes, isSelected, className } ) {
		const { content, hasFixedLayout } = attributes;
		const toggleFixedLayout = () => {
			setAttributes( { hasFixedLayout: ! hasFixedLayout } );
		};

		const classes = classnames(
			className,
			{
				'has-fixed-layout': hasFixedLayout,
			},
		);

		return (
			<Fragment>
				<InspectorControls>
					<PanelBody title={ __( 'Table Settings' ) } className="blocks-table-settings">
						<ToggleControl
							label={ __( 'Fixed width table cells' ) }
							checked={ !! hasFixedLayout }
							onChange={ toggleFixedLayout }
						/>
					</PanelBody>
				</InspectorControls>
				<TableBlock
					onChange={ ( nextContent ) => {
						setAttributes( { content: nextContent } );
					} }
					content={ content }
					className={ classes }
					isSelected={ isSelected }
				/>
			</Fragment>
		);
	},

	save( { attributes } ) {
		const { content, hasFixedLayout } = attributes;
		const classes = classnames(
			{
				'has-fixed-layout': hasFixedLayout,
			},
		);

		return (
			<RichText.Content tagName="table" className={ classes } value={ content } />
		);
	},
};
