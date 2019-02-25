/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	G,
	SVG,
	Path,
} from '@wordpress/components';

import {
	InnerBlocks,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';

export const name = 'core/columns';

export const settings = {
	title: __( 'Columns' ),

	icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path fill="none" d="M0 0h24v24H0V0z" /><G><Path d="M4,4H20a2,2,0,0,1,2,2V18a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V6A2,2,0,0,1,4,4ZM4 6V18H8V6Zm6 0V18h4V6Zm6 0V18h4V6Z" /></G></SVG>,

	category: 'layout',

	attributes: {
		columns: {
			type: 'number',
			default: 2,
		},
		verticalAlignment: {
			type: 'string',
		},
		childColumnHasVerticalAlignmentOveride: {
			type: 'bool',
		},
	},

	description: __( 'Add a block that displays content in multiple columns, then add whatever content blocks you’d like.' ),

	supports: {
		align: [ 'wide', 'full' ],
		html: false,
	},

	deprecated,

	edit,

	save( { attributes } ) {
		const { columns, verticalAlignment } = attributes;

		const wrapperClasses = classnames( `has-${ columns }-columns`, {
			[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
		} );

		return (
			<div className={ wrapperClasses }>
				<InnerBlocks.Content />
			</div>
		);
	},
};

