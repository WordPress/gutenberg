/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from 'api';
import Editable from 'components/editable';

const { parse, html, query, attr } = hpq;

const fromValueToParagraphs = ( value ) => value ? value.map( ( paragraph ) => `<p>${ paragraph }</p>` ).join( '' ) : '';
const fromParagraphsToValue = ( paragraphs ) => parse( paragraphs, query( 'p', html() ) );

registerBlock( 'core/quote', {
	title: wp.i18n.__( 'Quote' ),
	icon: 'format-quote',
	category: 'common',

	attributes: {
		value: query( 'blockquote > p', html() ),
		citation: html( 'footer' ),
		style: node => {
			const value = attr( 'blockquote', 'class' )( node );
			const match = value.match( /\bblocks-quote-style-(\d+)\b/ );
			return match ? +match[ 1 ] : null;
		},
	},

	controls: [ 1, 2 ].map( ( variation ) => ( {
		icon: 'format-quote',
		title: wp.i18n.sprintf( wp.i18n.__( 'Quote style %d' ), variation ),
		isActive: ( { style = 1 } ) => +style === +variation,
		onClick( attributes, setAttributes ) {
			setAttributes( { style: variation } );
		},
		subscript: variation
	} ) ),

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { value, citation } = attributes;
		const style = +attributes.style || 1;

		return (
			<blockquote className={ `blocks-quote blocks-quote-style-${ style }` }>
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
		const style = +attributes.style || 1;

		return (
			<blockquote className={ `blocks-quote-style-${ style }` }>
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
