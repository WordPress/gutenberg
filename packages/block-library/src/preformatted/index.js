/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock, getPhrasingContentSchema } from '@wordpress/blocks';
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
	title: __( 'Preformatted' ),

	description: __( 'Add text that respects your spacing and tabs, and also allows styling.' ),

	icon,

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/code', 'core/paragraph' ],
				transform: ( { content } ) =>
					createBlock( 'core/preformatted', {
						content,
					} ),
			},
			{
				type: 'raw',
				isMatch: ( node ) => (
					node.nodeName === 'PRE' &&
					! (
						node.children.length === 1 &&
						node.firstChild.nodeName === 'CODE'
					)
				),
				schema: {
					pre: {
						children: getPhrasingContentSchema(),
					},
				},
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
		const { content } = attributes;

		return <RichText.Content tagName="pre" value={ content } />;
	},

	merge( attributes, attributesToMerge ) {
		return {
			content: attributes.content + attributesToMerge.content,
		};
	},
};
