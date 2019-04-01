/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';

export const name = 'core/subhead';

export const settings = {
	title: __( 'Subheading (deprecated)' ),

	description: __( 'This block is deprecated. Please use the Paragraph block instead.' ),

	icon,

	category: 'common',

	supports: {
		// Hide from inserter as this block is deprecated.
		inserter: false,
		multiple: false,
	},

	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: 'p',
		},
		align: {
			type: 'string',
		},
	},

	transforms: {
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( attributes ) =>
					createBlock( 'core/paragraph', attributes ),
			},
		],
	},

	edit,

	save( { attributes } ) {
		const { align, content } = attributes;

		return (
			<RichText.Content
				tagName="p"
				style={ { textAlign: align } }
				value={ content }
			/>
		);
	},
};
