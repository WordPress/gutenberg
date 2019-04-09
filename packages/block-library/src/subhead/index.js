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
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Subheading (deprecated)' ),

	description: __( 'This block is deprecated. Please use the Paragraph block instead.' ),

	icon,

	supports: {
		// Hide from inserter as this block is deprecated.
		inserter: false,
		multiple: false,
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
