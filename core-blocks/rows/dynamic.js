/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'rows/dynamic';

export const settings = {
	title: __( 'Dynamic row' ),

	icon: 'columns',

	category: 'rows',

	attributes: {
		columns: {
			type: 'number',
			default: 1,
		},
		widths: {
			type: 'string',
			default: '12',
		},
	},

	description: __( 'Add a block that displays content in multiple columns, then add whatever content blocks you\'d like.' ),

	/* supports: {
		align: [ 'wide', 'full' ],
	},*/

	edit,

	save( { className } ) {
		return (
			<div className={ className }>
				<InnerBlocks.Content />
			</div>
		);
	},
};
