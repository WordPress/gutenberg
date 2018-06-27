/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/editor';

export const name = 'storypage/section';

export const settings = {
	title: __( 'Section' ),

	icon: 'editor-table',

	category: 'storypage',

	attributes: { },

	description: __( 'Add a block that displays content in multiple columns, then add whatever content blocks you\'d like.' ),

	edit( { className } ) {
		return (
			<div className={ className }>
				<InnerBlocks />
			</div>
		);
	},

	save( { className } ) {
		return (
			<div className={ className }>
				<InnerBlocks.Content />
			</div>
		);
	},
};
