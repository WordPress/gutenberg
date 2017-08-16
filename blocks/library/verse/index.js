/**
 * WordPress
 */
import { __ } from '@wordpress/i18n';
import { source } from '@wordpress/block-api';

/**
 * Internal dependencies
 */
import './editor.scss';
import { registerBlockType } from '../../api';
import Editable from '../../editable';
import InspectorControls from '../../inspector-controls';
import BlockDescription from '../../block-description';

const { children } = source;
const createTransformationBlock = ( name, attributes ) => ( { name, attributes } );

registerBlockType( 'core/verse', {
	title: __( 'Verse' ),

	icon: 'edit',

	category: 'formatting',

	keywords: [ __( 'poetry' ) ],

	attributes: {
		content: {
			type: 'array',
			source: children( 'pre' ),
		},
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( attributes ) =>
					createTransformationBlock( 'core/verse', attributes ),
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( attributes ) =>
					createTransformationBlock( 'core/paragraph', attributes ),
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
