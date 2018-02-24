/**
 * WordPress
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import { createBlock } from '../../api';
import RichText from '../../rich-text';

export const name = 'core/verse';

export const settings = {
	title: __( 'Verse' ),

	description: __( 'Write poetry and other literary expressions honoring all spaces and line-breaks.' ),

	icon: 'edit',

	category: 'formatting',

	keywords: [ __( 'poetry' ) ],

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

	edit( { attributes, setAttributes, className, isSelected } ) {
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
				placeholder={ __( 'Write…' ) }
				wrapperClassName={ className }
				formattingControls={ [ 'bold', 'italic', 'strikethrough' ] }
				isSelected={ isSelected }
			/>
		);
	},

	save( { attributes, className } ) {
		return <pre className={ className }>{ attributes.content }</pre>;
	},
};
