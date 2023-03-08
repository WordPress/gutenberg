// @ts-check

/**
 * External dependencies
 */
const { existsSync, readdirSync, readFileSync } = require( 'fs' );
const { join } = require( 'path' );

/**
 * Internal dependencies
 */
const {
	KNOWN_ATTRIBUTES,
	KNOWN_STYLES,
} = require( '../server-side-render.js' );

/*
 * Path to the lib/block-supports directory
 */
const BLOCK_SUPPORTS_DIR = 'lib/block-supports';

/*
 * Regular expression to match instances of PHP code inside BLOCK_SUPPORTS_DIR
 * where an attribute is being accessed by name.
 *
 * @example $block_type->attributes['anchor'] = array( ... )
 */
const ATTRIBUTE_KEY_PATTERN = /attributes\['(\w+)'\]/g;

/*
 * Regular expression to match instances of PHP code inside BLOCK_SUPPORTS_DIR
 * where a style property is being accessed by name.
 *
 * @example $block_attributes['style']['typography']['letterSpacing']
 */
const STYLE_KEY_PATTERN = /\['style'\]\['(\w+)'\]/g;

describe( 'removeBlockSupportAttributes', () => {
	it( 'tests should be able to access lib/block-supports', () => {
		expect( existsSync( BLOCK_SUPPORTS_DIR ) ).toBe( true );
	} );

	it( 'tests should be able to read source code from lib/block-supports', () => {
		const dir = readdirSync( BLOCK_SUPPORTS_DIR );
		expect( dir ).toContainEqual( expect.stringMatching( /\.php$/ ) );
	} );

	it( 'its constant KNOWN_ATTRIBUTES is up to date', () => {
		// Get all PHP files in lib/block-supports
		const sourceFiles = readdirSync( BLOCK_SUPPORTS_DIR )
			.filter( ( file ) => file.match( /\.php$/ ) )
			.map( ( file ) => join( BLOCK_SUPPORTS_DIR, file ) );

		// Get all unique attribute names from the PHP files
		const attributes = new Set(
			sourceFiles.flatMap( ( file ) =>
				grep( file, ATTRIBUTE_KEY_PATTERN )
					.filter( ( attribute ) => attribute !== 'style' ) // Styles are handled separately
					.map( ( attribute ) =>
						attribute.replace( /^class$/, 'className' )
					)
			)
		);

		expect( attributes ).toEqual( KNOWN_ATTRIBUTES );
	} );

	it( 'its constant KNOWN_STYLES is up to date', () => {
		// Get all PHP files in lib/block-supports
		const sourceFiles = readdirSync( BLOCK_SUPPORTS_DIR )
			.filter( ( file ) => file.match( /\.php$/ ) )
			.map( ( file ) => join( BLOCK_SUPPORTS_DIR, file ) );

		// Get all unique style keys from the PHP files
		const styles = new Set(
			sourceFiles.flatMap( ( file ) => grep( file, STYLE_KEY_PATTERN ) )
		);

		// styles should be a subset of KNOWN_STYLES
		expect( Array.from( KNOWN_STYLES ) ).not.toEqual(
			expect.not.arrayContaining( Array.from( styles ) )
		);
	} );
} );

/**
 * Given a filename and a RegExp pattern, return all fragments of text in the
 * given file that match the pattern.
 *
 * @param {string} filename Path to the source file.
 * @param {RegExp} pattern  Regular expression to match against.
 * @return {string[]}       Set of matching attribute names.
 */
function grep( filename, pattern ) {
	const contents = readFileSync( filename, 'utf8' ).toString();
	const matches = Array.from( contents.matchAll( pattern ) );
	return matches.map( ( [ , match ] ) => match );
}
