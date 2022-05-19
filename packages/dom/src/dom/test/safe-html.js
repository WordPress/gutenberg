/**
 * Internal dependencies
 */
import safeHTML from '../safe-html';

describe( 'safeHTML', () => {
	it( 'should strip on* attributes', () => {
		const input = '<img src="" onerror="alert(\'1\')" onload="">';
		const output = '<img src="">';
		expect( safeHTML( input ) ).toBe( output );
	} );

	it( 'should strip on* attributes with spacing', () => {
		const input = '<img src="" onerror = "alert(\'1\')" onload = "">';
		const output = '<img src="">';
		expect( safeHTML( input ) ).toBe( output );
	} );

	it( 'should strip nested on* attributes', () => {
		const input =
			'<p><strong><img src="" onerror="alert(\'1\')"></strong></p>';
		const output = '<p><strong><img src=""></strong></p>';
		expect( safeHTML( input ) ).toBe( output );
	} );

	it( 'should strip script tags', () => {
		const input = '<script>alert("1")</script><script></script>';
		const output = '';
		expect( safeHTML( input ) ).toBe( output );
	} );
} );
