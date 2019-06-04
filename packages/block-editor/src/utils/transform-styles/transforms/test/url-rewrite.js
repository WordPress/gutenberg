/**
 * Internal dependencies
 */
import traverse from '../../traverse';
import rewrite from '../url-rewrite';

describe( 'URL rewrite', () => {
	it( 'should replace relative paths', () => {
		const callback = rewrite( 'http://wp-site.local/themes/gut/css/' );
		const input = `h1 { background: url(images/test.png); }`;
		const output = traverse( input, callback );

		expect( output ).toMatchSnapshot();
	} );

	it( 'should replace complex relative paths', () => {
		const callback = rewrite( 'http://wp-site.local/themes/gut/css/' );
		const input = `h1 { background: url(../images/test.png); }`;
		const output = traverse( input, callback );

		expect( output ).toMatchSnapshot();
	} );

	it( 'should not replace absolute paths', () => {
		const callback = rewrite( 'http://wp-site.local/themes/gut/css/' );
		const input = `h1 { background: url(/images/test.png); }`;
		const output = traverse( input, callback );

		expect( output ).toMatchSnapshot();
	} );

	it( 'should not replace remote paths', () => {
		const callback = rewrite( 'http://wp-site.local/themes/gut/css/' );
		const input = `h1 { background: url(http://wp.org/images/test.png); }`;
		const output = traverse( input, callback );

		expect( output ).toMatchSnapshot();
	} );
} );
