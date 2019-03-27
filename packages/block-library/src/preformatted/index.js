/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock, getPhrasingContentSchema } from '@wordpress/blocks';
import { RichText } from '@wordpress/block-editor';
import { Path, Rect, SVG } from '@wordpress/components';

export const name = 'core/preformatted';

export const settings = {
	title: __( 'Preformatted' ),

	description: __( 'Add text that respects your spacing and tabs, and also allows styling.' ),

	icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path d="M0,0h24v24H0V0z" fill="none" /><Path d="M20,4H4C2.9,4,2,4.9,2,6v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V6C22,4.9,21.1,4,20,4z M20,18H4V6h16V18z" /><Rect x="6" y="10" width="2" height="2" /><Rect x="6" y="14" width="8" height="2" /><Rect x="16" y="14" width="2" height="2" /><Rect x="10" y="10" width="8" height="2" /></SVG>,

	category: 'formatting',

	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: 'pre',
			default: '',
		},
	},

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

	edit( { attributes, mergeBlocks, setAttributes, className } ) {
		const { content } = attributes;

		return (
			<RichText
				tagName="pre"
				// Ensure line breaks are normalised to HTML.
				value={ content.replace( /\n/g, '<br>' ) }
				onChange={ ( nextContent ) => {
					setAttributes( {
						// Ensure line breaks are normalised to characters. This
						// saves space, is easier to read, and ensures display
						// filters work correctly.
						content: nextContent.replace( /<br ?\/?>/g, '\n' ),
					} );
				} }
				placeholder={ __( 'Write preformatted text…' ) }
				wrapperClassName={ className }
				onMerge={ mergeBlocks }
			/>
		);
	},

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
