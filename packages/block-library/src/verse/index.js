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

export const name = 'core/verse';

export const settings = {
	title: __( 'Verse' ),

	description: __( 'Insert poetry. Use special spacing formats. Or quote song lyrics.' ),

	icon,

	category: 'formatting',

	keywords: [ __( 'poetry' ) ],

	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: 'pre',
			default: '',
		},
		textAlign: {
			type: 'string',
		},
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( attributes ) =>
					createBlock( 'core/verse', attributes ),
			},
		],
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
		const { textAlign, content } = attributes;

		return (
			<RichText.Content
				tagName="pre"
				style={ { textAlign } }
				value={ content }
			/>
		);
	},

	merge( attributes, attributesToMerge ) {
		return {
			content: attributes.content + attributesToMerge.content,
		};
	},
};
