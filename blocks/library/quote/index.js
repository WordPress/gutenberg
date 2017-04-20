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
		value: query( 'blockquote > p', html() ),
		citation: html( 'footer' )
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { value, citation } = attributes;

		return (
			<blockquote className="blocks-quote">
				<Editable
					value={ fromValueToParagraphs( value ) }
					onChange={
						( paragraphs ) => setAttributes( {
							value: fromParagraphsToValue( paragraphs )
						} )
					}
					focus={ focus && focus.editable === 'value' ? focus : null }
					onFocus={ () => setFocus( { editable: 'value' } ) }
				/>
				{ ( citation || !! focus ) &&
					<footer>
						<Editable
							value={ citation }
							onChange={
								( newValue ) => setAttributes( {
									citation: newValue
								} )
							}
							focus={ focus && focus.editable === 'citation' ? focus : null }
							onFocus={ () => setFocus( { editable: 'citation' } ) }
						/>
					</footer>
				}
			</blockquote>
		);
	},

	save( attributes ) {
		const { value, citation } = attributes;

		return (
			<blockquote>
				{ value && value.map( ( paragraph, i ) => (
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
