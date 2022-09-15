/**
 * Internal dependencies
 */
import stripHTML from '../strip-html';

describe( 'stripHTML', () => {
	it( 'should strip valid HTML, scripts and on attributes', () => {
		const input = `<strong onClick="alert('and on attributes')">Here is some text</strong> that contains <em>HTML markup</em><script>alert("and scripts")</script>.`;
		const output = 'Here is some text that contains HTML markup.';
		expect( stripHTML( input ) ).toBe( output );
	} );

	it( 'should strip invalid HTML, scripts and on attributes', () => {
		const input = `<strong onClick="alert('and on attributes')">Here is some text</em> <p></div>that contains HTML markup</p><script>alert("and scripts")</script>.`;
		const output = 'Here is some text that contains HTML markup.';
		expect( stripHTML( input ) ).toBe( output );
	} );

	describe( 'whitespace preservation', () => {
		it( 'should preserve leading spaces', () => {
			const input =
				'       <strong>Here is some text</strong> with <em>leading spaces</em>.';
			const output = '       Here is some text with leading spaces.';
			expect( stripHTML( input ) ).toBe( output );
		} );

		it( 'should preserve leading spaces with HTML', () => {
			const input =
				'<strong>      Here is some text</strong> with <em>leading spaces</em>.';
			const output = '      Here is some text with leading spaces.';
			expect( stripHTML( input ) ).toBe( output );
		} );

		it( 'should preserve trailing spaces with HTML', () => {
			const input =
				'<strong>Here is some text</strong> with <em>trailing spaces</em>.          ';
			const output = 'Here is some text with trailing spaces.          ';
			expect( stripHTML( input ) ).toBe( output );
		} );

		it( 'should preserve consecutive spaces within string', () => {
			const input =
				'<strong>Here is some          text</strong> with                  <em>a lot of spaces inside</em>.';
			const output =
				'Here is some          text with                  a lot of spaces inside.';
			expect( stripHTML( input ) ).toBe( output );
		} );

		it( 'should preserve new lines in multi-line HTML string', () => {
			const input = `<div>
        Here is some
        <em>text</em>
        with new lines
        </div>`;

			const output = `
        Here is some
        text
        with new lines
        `;
			expect( stripHTML( input ) ).toBe( output );
		} );
	} );
} );
