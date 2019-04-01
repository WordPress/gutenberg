/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';
import {
	RichText,
	BlockControls,
	AlignmentToolbar,
} from '@wordpress/block-editor';
import { SVG, Path } from '@wordpress/components';

export const name = 'core/verse';

export const settings = {
	title: __( 'Verse' ),

	description: __( 'Insert poetry. Use special spacing formats. Or quote song lyrics.' ),

	icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path d="M21 11.01L3 11V13H21V11.01ZM3 16H17V18H3V16ZM15 6H3V8.01L15 8V6Z" /></SVG>,

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

	edit( { attributes, setAttributes, className, mergeBlocks } ) {
		const { textAlign, content } = attributes;

		return (
			<Fragment>
				<BlockControls>
					<AlignmentToolbar
						value={ textAlign }
						onChange={ ( nextAlign ) => {
							setAttributes( { textAlign: nextAlign } );
						} }
					/>
				</BlockControls>
				<RichText
					tagName="pre"
					value={ content }
					onChange={ ( nextContent ) => {
						setAttributes( {
							content: nextContent,
						} );
					} }
					style={ { textAlign } }
					placeholder={ __( 'Write…' ) }
					wrapperClassName={ className }
					onMerge={ mergeBlocks }
				/>
			</Fragment>
		);
	},

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
