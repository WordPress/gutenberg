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
		const attributes = new Set();
		const dir = readdirSync( BLOCK_SUPPORTS_DIR );

		for ( const fileName of dir ) {
			if ( fileName.match( /\.php$/ ) ) {
				const path = join( BLOCK_SUPPORTS_DIR, fileName );
				for ( let attributeName of grep(
					path,
					ATTRIBUTE_KEY_PATTERN
				) ) {
					if ( attributeName === 'class' )
						attributeName = 'className';
					attributes.add( attributeName );
				}
			}
		}

		// Styles are handled separately.
		attributes.delete( 'style' );

		expect( attributes ).toEqual( KNOWN_ATTRIBUTES );
	} );

	it( 'its constant KNOWN_STYLES is up to date', () => {
		const styles = new Set();
		const dir = readdirSync( BLOCK_SUPPORTS_DIR );

		for ( const fileName of dir ) {
			if ( fileName.match( /\.php$/ ) ) {
				const path = join( BLOCK_SUPPORTS_DIR, fileName );
				for ( let attributeName of grep( path, STYLE_KEY_PATTERN ) ) {
					if ( attributeName === 'class' )
						attributeName = 'className';
					styles.add( attributeName );
				}
			}
		}

		expect( styles ).toEqual( KNOWN_STYLES );
	} );
} );

/**
 * @param {string} filename Path to the source file.
 * @param {RegExp} pattern  Regular expression to match against.
 * @return {Set<string>}    Set of matching attribute names.
 */
function grep( filename, pattern ) {
	const contents = readFileSync( filename, 'utf8' ).toString();
	const matches = Array.from( contents.matchAll( pattern ) );
	return new Set( matches.map( ( [ , match ] ) => match ) );
}
