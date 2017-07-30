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
import InspectorControls from '../../inspector-controls';
import BlockDescription from '../../block-description';

const { children } = query;

registerBlockType( 'core/verse', {
	title: __( 'Verse' ),

	icon: 'edit',

	category: 'formatting',

	attributes: {
		content: children( 'pre' ),
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
				className={ className }
				formattingControls={ [ 'bold', 'italic', 'strikethrough' ] }
			/>,
		];
	},

	save( { attributes, className } ) {
		return <pre className={ className }>{ attributes.content }</pre>;
	},
} );
