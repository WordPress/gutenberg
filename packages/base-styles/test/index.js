/**
 * External dependencies
 */
const util = require( 'util' );
const nodeSass = require( 'node-sass' );
const path = require( 'path' );

const run = ( filename ) => {
	return util.promisify( nodeSass.render )( {
		file: path.resolve( __dirname, filename ),
	} );
};

describe( 'base-styles', () => {
	it( 'can use animations', ( ) => {
		return run( 'animations.scss' ).then( ( result ) => {
			expect( result.css.toString() ).toMatchSnapshot();
		} );
	} );

	it( 'can use breakpoints', ( ) => {
		return run( 'breakpoints.scss' ).then( ( result ) => {
			expect( result.css.toString() ).toMatchSnapshot();
		} );
	} );

	it( 'can use colors', ( ) => {
		return run( 'colors.scss' ).then( ( result ) => {
			expect( result.css.toString() ).toMatchSnapshot();
		} );
	} );

	it( 'can use mixins', ( ) => {
		return run( 'mixins.scss' ).then( ( result ) => {
			expect( result.css.toString() ).toMatchSnapshot();
		} );
	} );

	it( 'can use variables', ( ) => {
		return run( 'variables.scss' ).then( ( result ) => {
			expect( result.css.toString() ).toMatchSnapshot();
		} );
	} );

	it( 'can use z-indexes', ( ) => {
		return run( 'z-index.scss' ).then( ( result ) => {
			expect( result.css.toString() ).toMatchSnapshot();
		} );
	} );
} );
