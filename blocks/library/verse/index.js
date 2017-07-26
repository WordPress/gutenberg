/**
 * WordPress
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, createBlock, query } from '../../api';
import Editable from '../../editable';

const { html } = query;

registerBlockType( 'core/verse', {
	title: __( 'Verse' ),

	icon: 'carrot',

	category: 'formatting',

	attributes: {
		content: html( 'pre' ),
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( attributes ) =>
					createBlock( 'core/verse', attributes ),
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( attributes ) =>
					createBlock( 'core/text', attributes ),
			},
		],
	},

	edit( { attributes, setAttributes, focus, setFocus, className } ) {
		const { content } = attributes;

		return (
			<Editable
				tagName="pre"
				value={ content }
				onChange={ ( nextContent ) => {
					setAttributes( {
						content: nextContent,
					} );
				} }
				focus={ focus }
				onFocus={ setFocus }
				placeholder={ __( 'Write…' ) }
				className={ className }
				formattingControls={ [ 'bold', 'italic', 'strikethrough' ] }
			/>
		);
	},

	save( { attributes, className } ) {
		return <pre className={ className }>{ attributes.content }</pre>;
	},
} );
