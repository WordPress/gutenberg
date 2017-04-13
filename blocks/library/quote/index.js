/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlock, query as hpq } from 'api';
import Editable from 'components/editable';

const { html, query } = hpq;

registerBlock( 'core/quote', {
	title: wp.i18n.__( 'Quote' ),
	icon: 'format-quote',
	category: 'common',

	attributes: {
		value: ( node ) => query( 'blockquote > p', html() )( node )
			.map( innerHTML => `<p>${ innerHTML }</p>` )
			.join( '' ),
		citation: html( 'footer' )
	},

	edit( { attributes, setAttributes } ) {
		const { value, citation } = attributes;

		return (
			<blockquote className="blocks-quote">
				<Editable
					value={ value }
					onChange={ ( newValue ) => setAttributes( { value: newValue } ) } />
				<footer>
					<Editable
						value={ citation }
						onChange={ ( newValue ) => setAttributes( { citation: newValue } ) } />
				</footer>
			</blockquote>
		);
	},

	save( attributes ) {
		const { value, citation } = attributes;
		return [
			'<blockquote>',
			value,
			citation
				? `<footer>${ citation }</footer>`
				: '',
			'</blockquote>'
		].join( '' );
	}
} );
