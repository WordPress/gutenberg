/**
 * Internal dependencies
 */
import { registerBlock, query as hpq } from 'api';
import Editable from 'components/editable';

const { html, parse, query } = hpq;

const fromValueToParagraphs = ( value ) => value ? value.map( ( paragraph ) => `<p>${ paragraph }</p>` ).join( '' ) : '';
const fromParagraphsToValue = ( paragraphs ) => parse( paragraphs, query( 'p', html() ) );

registerBlock( 'core/text', {
	title: wp.i18n.__( 'Text' ),

	icon: 'text',

	category: 'common',

	attributes: {
		content: query( 'p', html() ),
	},

	controls: [
		{
			icon: 'editor-alignleft',
			title: wp.i18n.__( 'Align left' ),
			isActive: ( { align } ) => ! align || 'left' === align,
			onClick( attributes, setAttributes ) {
				setAttributes( { align: undefined } );
			}
		},
		{
			icon: 'editor-aligncenter',
			title: wp.i18n.__( 'Align center' ),
			isActive: ( { align } ) => 'center' === align,
			onClick( attributes, setAttributes ) {
				setAttributes( { align: 'center' } );
			}
		},
		{
			icon: 'editor-alignright',
			title: wp.i18n.__( 'Align right' ),
			isActive: ( { align } ) => 'right' === align,
			onClick( attributes, setAttributes ) {
				setAttributes( { align: 'right' } );
			}
		}
	],

	edit( { attributes, setAttributes, insertBlockAfter } ) {
		const { content, align } = attributes;

		return (
			<Editable
				value={ fromValueToParagraphs( content ) }
				onChange={ ( paragraphs ) => setAttributes( {
					content: fromParagraphsToValue( paragraphs )
				} ) }
				style={ align ? { textAlign: align } : null }
				onSplit={ ( before, after ) => {
					setAttributes( { content: fromParagraphsToValue( before ) } );
					insertBlockAfter( wp.blocks.createBlock( 'core/text', {
						content: fromParagraphsToValue( after )
					} ) );
				} }
			/>
		);
	},

	save( { attributes } ) {
		const { align, content } = attributes;

		// Todo: Remove the temporary <div> wrapper once the serializer supports returning an array
		return (
			<div>
				{ content && content.map( ( paragraph, i ) => (
					<p
						key={ i }
						style={ align ? { textAlign: align } : null }
						dangerouslySetInnerHTML={ {
							__html: paragraph
						} } />
				) ) }
			</div>
		);
	}
} );
