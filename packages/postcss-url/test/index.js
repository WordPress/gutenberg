/**
 * External dependencies
 */
import postcss from 'postcss';

/**
 * Internal dependencies
 */
import plugin from '../src';

/**
 * Module constants
 */
const defaultOptions = {
	baseURL: 'http://wp-site.local/themes/gut/css/',
};

const run = ( input, opts = defaultOptions ) => {
	return postcss( [ plugin( opts ) ] ).process( input, { from: undefined } );
};

describe( 'postcss-url', () => {
	it( 'Should replace relative paths', () => {
		const input = `body { background: url(images/test.png); }`;
		return run( input ).then( ( result ) => {
			expect( result.css ).toMatchSnapshot();
			expect( result.warnings() ).toHaveLength( 0 );
		} );
	} );

	it( 'Should replace complex relative paths', () => {
		const input = `body { background: url(../images/test.png); }`;
		return run( input ).then( ( result ) => {
			expect( result.css ).toMatchSnapshot();
			expect( result.warnings() ).toHaveLength( 0 );
		} );
	} );

	it( 'Should not replace absolute paths', () => {
		const input = `body { background: url(/images/test.png); }`;
		return run( input ).then( ( result ) => {
			expect( result.css ).toMatchSnapshot();
			expect( result.warnings() ).toHaveLength( 0 );
		} );
	} );

	it( 'Should not replace remote paths', () => {
		const input = `body { background: url(http://wp-site.local/images/test.png); }`;
		return run( input ).then( ( result ) => {
			expect( result.css ).toMatchSnapshot();
			expect( result.warnings() ).toHaveLength( 0 );
		} );
	} );
} );
