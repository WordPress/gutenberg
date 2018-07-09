/**
 * Internal dependencies
 */
import {
	createElement,
	RawHTML,
	renderToString,
} from '../';

describe( 'renderToString', () => {
	it( 'should return an empty string for booleans/null/undefined values', () => {
		expect( renderToString() ).toBe( '' );
		expect( renderToString( false ) ).toBe( '' );
		expect( renderToString( true ) ).toBe( '' );
		expect( renderToString( null ) ).toBe( '' );
	} );

	it( 'should return a string 0', () => {
		expect( renderToString( 0 ) ).toBe( '0' );
	} );

	it( 'should return a string 12345', () => {
		expect( renderToString( 12345 ) ).toBe( '12345' );
	} );

	it( 'should return a string verbatim', () => {
		expect( renderToString( 'Zucchini' ) ).toBe( 'Zucchini' );
	} );

	it( 'should return a string from an array', () => {
		expect( renderToString( [
			'Zucchini ',
			createElement( 'em', null, 'is a' ),
			' summer squash',
		] ) ).toBe( 'Zucchini <em>is a</em> summer squash' );
	} );

	it( 'should return a string from an element', () => {
		expect( renderToString(
			createElement( 'strong', null, 'Courgette' )
		) ).toBe( '<strong>Courgette</strong>' );
	} );

	it( 'should escape attributes and html', () => {
		const result = renderToString( createElement( 'a', {
			href: '/index.php?foo=bar&qux=<"scary">',
			style: {
				backgroundColor: 'red',
			},
		}, '<"WordPress" & Friends>' ) );

		expect( result ).toBe(
			'<a href="/index.php?foo=bar&amp;qux=<&quot;scary&quot;>" style="background-color:red">' +
			'&lt;"WordPress" &amp; Friends>' +
			'</a>'
		);
	} );

	it( 'strips raw html wrapper', () => {
		const html = '<p>So scary!</p>';

		expect( renderToString(
			<RawHTML>{ html }</RawHTML>,
		) ).toBe( html );
	} );
} );
