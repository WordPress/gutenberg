/**
 * WordPress
 */
import { __ } from '@wordpress/i18n';
import {
	createBlock,
	RichText,
	getPhrasingContentSchema,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './editor.scss';

export const name = 'core/preformatted';

export const settings = {
	title: __( 'Preformatted' ),

	description: __( 'Preformatted text keeps your spaces, tabs and linebreaks as they are.' ),

	icon: 'text',

	category: 'formatting',

	attributes: {
		content: {
			type: 'array',
			source: 'children',
			selector: 'pre',
		},
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( attributes ) =>
					createBlock( 'core/preformatted', attributes ),
			},
			{
				type: 'raw',
				isMatch: ( node ) => (
					node.matches( 'pre' ) &&
					! (
						node.children.length === 1 &&
						node.firstChild.matches( 'code' )
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

	edit( { attributes, setAttributes, className } ) {
		const { content } = attributes;

		return (
			<RichText
				tagName="pre"
				value={ content }
				onChange={ ( nextContent ) => {
					setAttributes( {
						content: nextContent,
					} );
				} }
				placeholder={ __( 'Write preformatted text…' ) }
				wrapperClassName={ className }
			/>
		);
	},

	save( { attributes } ) {
		const { content } = attributes;

		return <RichText.Content tagName="pre" value={ content } />;
	},
};
