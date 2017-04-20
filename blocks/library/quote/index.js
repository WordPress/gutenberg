/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from 'api';
import Editable from 'components/editable';

const { parse, html, query } = hpq;

const fromValueToParagraphs = ( value ) => value ? value.map( ( paragraph ) => `<p>${ paragraph }</p>` ).join( '' ) : '';
const fromParagraphsToValue = ( paragraphs ) => parse( paragraphs, query( 'p', html() ) );

registerBlock( 'core/quote', {
	title: wp.i18n.__( 'Quote' ),
	icon: 'format-quote',
	category: 'common',

	attributes: {
		content: query( 'blockquote > p', html() ),
		citation: html( 'footer' )
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { content } ) => {
					return {
						content,
					};
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/text' ],
				transform: ( { content, citation } ) => {
					if ( citation ) {
						content = ( content || [] ).concat( citation );
					}
					return {
						content,
					};
				},
			},
		],
	},

	edit( { attributes, setAttributes } ) {
		const { content, citation } = attributes;

		return (
			<blockquote className="blocks-quote">
				<Editable
					value={ fromValueToParagraphs( content ) }
					onChange={
						( paragraphs ) => setAttributes( {
							content: fromParagraphsToValue( paragraphs )
						} )
					} />
				<footer>
					<Editable
						value={ citation }
						onChange={
							( newValue ) => setAttributes( {
								citation: newValue
							} )
						} />
				</footer>
			</blockquote>
		);
	},

	save( attributes ) {
		const { content, citation } = attributes;

		return (
			<blockquote>
				{ content && content.map( ( paragraph, i ) => (
					<p
						key={ i }
						dangerouslySetInnerHTML={ {
							__html: paragraph
						} } />
				) ) }
				<footer dangerouslySetInnerHTML={ {
					__html: citation
				} } />
			</blockquote>
		);
	}
} );
