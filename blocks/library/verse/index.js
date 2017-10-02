/**
 * WordPress
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import { registerBlockType, createBlock, source } from '../../api';
import Editable from '../../editable';
import InspectorControls from '../../inspector-controls';
import BlockDescription from '../../block-description';

const { html } = source;

registerBlockType( 'core/verse', {
	title: __( 'Verse' ),

	icon: 'edit',

	category: 'formatting',

	keywords: [ __( 'poetry' ) ],

	attributes: {
		content: {
			type: 'string',
			source: html( 'pre' ),
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

	edit( { attributes, setAttributes, focus, setFocus, className } ) {
		const { content } = attributes;

		return [
			focus && (
				<InspectorControls key="inspector">
					<BlockDescription>
						<p>{ __( 'Write poetry and other literary expressions honoring all spaces and line-breaks.' ) }</p>
					</BlockDescription>
				</InspectorControls>
			),
			<Editable
				tagName="pre"
				key="editable"
				value={ content }
				onChange={ ( nextContent ) => {
					setAttributes( {
						content: nextContent,
					} );
				} }
				focus={ focus }
				onFocus={ setFocus }
				placeholder={ __( 'Write…' ) }
				wrapperClassname={ className }
				formattingControls={ [ 'bold', 'italic', 'strikethrough' ] }
			/>,
		];
	},

	save( { attributes, className } ) {
		return <Editable.Value tagName="pre" className={ className }>{ attributes.content }</Editable.Value>;
	},
} );
