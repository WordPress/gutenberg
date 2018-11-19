/**
 * Internal dependencies
 */
import traverse from '../../traverse';
import wrap from '../wrap';

describe( 'CSS selector wrap', () => {
	it( 'should wrap regular selectors', () => {
		const callback = wrap( '.my-namespace' );
		const input = `h1 { color: red; }`;
		const output = traverse( input, callback );

		expect( output ).toMatchSnapshot();
	} );

	it( 'should wrap multiple selectors', () => {
		const callback = wrap( '.my-namespace' );
		const input = `h1, h2 { color: red; }`;
		const output = traverse( input, callback );

		expect( output ).toMatchSnapshot();
	} );

	it( 'should ignore selectors', () => {
		const callback = wrap( '.my-namespace', 'body' );
		const input = `h1, body { color: red; }`;
		const output = traverse( input, callback );

		expect( output ).toMatchSnapshot();
	} );

	it( 'should replace root tags', () => {
		const callback = wrap( '.my-namespace' );
		const input = `body, h1 { color: red; }`;
		const output = traverse( input, callback );

		expect( output ).toMatchSnapshot();
	} );

	it( 'should ignore keyframes', () => {
		const callback = wrap( '.my-namespace' );
		const input = `
		@keyframes edit-post__fade-in-animation {
			from {
				opacity: 0;
			}
		}`;
		const output = traverse( input, callback );

		expect( output ).toMatchSnapshot();
	} );

	it( 'should ignore font-face selectors', () => {
		const callback = wrap( '.my-namespace' );
		const input = `
		@font-face {
			font-family: myFirstFont;
			src: url(sansation_light.woff);
		}`;
		const output = traverse( input, callback );

		expect( output ).toMatchSnapshot();
	} );
} );
