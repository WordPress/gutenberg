export const jsTester = ( parse ) => () => {
	describe( 'basic parsing', () => {
		test( 'parse() works properly', () => {
			expect( parse( '<!-- wp:core/more --><!--more--><!-- /wp:core/more -->' ) ).toMatchSnapshot();
		} );
	} );

	describe( 'generic tests', () => {
		test( 'parse() accepts inputs with multiple Reusable blocks', () => {
			expect( parse( '<!-- wp:block {"ref":313} /--><!-- wp:block {"ref":482} /-->' ) ).toEqual( [
				expect.objectContaining( {
					blockName: 'core/block',
					attrs: { ref: 313 },
				} ),
				expect.objectContaining( {
					blockName: 'core/block',
					attrs: { ref: 482 },
				} ),
			] );
		} );

		test( 'treats void blocks and empty blocks identically', () => {
			expect( parse(
				'<!-- wp:block /-->'
			) ).toEqual( parse(
				'<!-- wp:block --><!-- /wp:block -->'
			) );

			expect( parse(
				'<!-- wp:my/bus { "is": "fast" } /-->'
			) ).toEqual( parse(
				'<!-- wp:my/bus { "is": "fast" } --><!-- /wp:my/bus -->'
			) );
		} );

		test( 'should grab HTML soup before block openers', () => {
			[
				'<p>Break me</p><!-- wp:block /-->',
				'<p>Break me</p><!-- wp:block --><!-- /wp:block -->',
			].forEach( ( input ) => expect( parse( input ) ).toEqual( [
				expect.objectContaining( { innerHTML: '<p>Break me</p>' } ),
				expect.objectContaining( { blockName: 'core/block', innerHTML: '' } ),
			] ) );
		} );

		test( 'should grab HTML soup before inner block openers', () => [
			'<!-- wp:outer --><p>Break me</p><!-- wp:block /--><!-- /wp:outer -->',
			'<!-- wp:outer --><p>Break me</p><!-- wp:block --><!-- /wp:block --><!-- /wp:outer -->',
		].forEach( ( input ) => expect( parse( input ) ).toEqual( [
			expect.objectContaining( {
				innerBlocks: [ expect.objectContaining( { blockName: 'core/block', innerHTML: '' } ) ],
				innerHTML: '<p>Break me</p>',
			} ),
		] ) ) );

		test( 'should grab HTML soup after blocks', () => [
			'<!-- wp:block /--><p>Break me</p>',
			'<!-- wp:block --><!-- /wp:block --><p>Break me</p>',
		].forEach( ( input ) => expect( parse( input ) ).toEqual( [
			expect.objectContaining( { blockName: 'core/block', innerHTML: '' } ),
			expect.objectContaining( { innerHTML: '<p>Break me</p>' } ),
		] ) ) );
	} );

	describe( 'blockMarkers', () => {
		test( 'adds empty block markers when no inner blocks exist', () => {
			expect( parse( '<!-- wp:void /-->' )[ 0 ] ).toHaveProperty( 'blockMarkers', [] );
			expect( parse( '<!-- wp:block --><!-- /wp:block -->' )[ 0 ] ).toHaveProperty( 'blockMarkers', [] );
			expect( parse( '<!-- wp:block -->with content<!-- /wp:block -->' )[ 0 ] ).toHaveProperty( 'blockMarkers', [] );
		} );

		test( 'adds block markers for inner blocks', () => {
			expect( parse( '<!-- wp:block --><!-- wp:void /--><!-- /wp:block -->' )[ 0 ] ).toHaveProperty( 'blockMarkers', [ 0 ] );
			expect( parse( '<!-- wp:block -->aa<!-- wp:void /-->bb<!-- /wp:block -->' )[ 0 ] ).toHaveProperty( 'blockMarkers', [ 2 ] );
			expect( parse( '<!-- wp:block -->aa<!-- wp:inner -->bb<!-- /wp:inner -->cc<!-- /wp:block -->' )[ 0 ] ).toHaveProperty( 'blockMarkers', [ 2 ] );
			expect( parse( '<!-- wp:block --><!-- wp:start /-->aa<!-- wp:inner -->bb<!-- /wp:inner -->cc<!-- wp:end /--><!-- /wp:block -->' )[ 0 ] ).toHaveProperty( 'blockMarkers', [ 0, 2, 4 ] );
		} );

		test( 'block markers report UTF-8 encoding byte-length', () => {
			const run = ( c ) => parse( `<!-- wp:block -->${ c }<!-- wp:void /--><!-- /wp:block -->` )[ 0 ];

			// normal conditions
			expect( run( '\u{0024}' ) ).toHaveProperty( 'blockMarkers', [ 1 ] ); // $ U+0000 - U+007F
			expect( run( '\u{00a2}' ) ).toHaveProperty( 'blockMarkers', [ 2 ] ); // ¢ U+0080 - U+07FF
			expect( run( '\u{20ac}' ) ).toHaveProperty( 'blockMarkers', [ 3 ] ); // € U+0800 - U+7FFF
			expect( run( '\u{f8ff}' ) ).toHaveProperty( 'blockMarkers', [ 3 ] ); //  U+8000 - U+FFFF
			expect( run( '\u{10348}' ) ).toHaveProperty( 'blockMarkers', [ 4 ] ); // 𐍈 U+10000 - U+1FFFF

			expect( run( '$' ) ).toHaveProperty( 'blockMarkers', [ 1 ] ); // $ U+0000 - U+007F
			expect( run( '¢' ) ).toHaveProperty( 'blockMarkers', [ 2 ] ); // ¢ U+0080 - U+07FF
			expect( run( '€' ) ).toHaveProperty( 'blockMarkers', [ 3 ] ); // € U+0800 - U+7FFF
			expect( run( '' ) ).toHaveProperty( 'blockMarkers', [ 3 ] ); //  U+8000 - U+FFFF
			expect( run( '𐍈' ) ).toHaveProperty( 'blockMarkers', [ 4 ] ); // 𐍈 U+10000 - U+1FFFF

			// surrogate pairs
			expect( run( '\u{d800}' ) ).toHaveProperty( 'blockMarkers', [ 3 ] ); // invalid unpaired surrogate
			expect( run( '\u{dc00}' ) ).toHaveProperty( 'blockMarkers', [ 3 ] ); // invalid unpaired surrogate
			expect( run( '\u{10000}' ) ).toHaveProperty( 'blockMarkers', [ 4 ] ); // 𐀀 surrogate pair U+D800 U+DC00
			expect( run( '\ud800\udc00' ) ).toHaveProperty( 'blockMarkers', [ 4 ] ); // 𐀀 surrogate pair U+D800 U+DC00
			expect( run( '𐀀' ) ).toHaveProperty( 'blockMarkers', [ 4 ] ); // 𐀀 surrogate pair U+D800 U+DC00

			// variations
			expect( run( '\u{845b}' ) ).toHaveProperty( 'blockMarkers', [ 3 ] ); // edible bean; surname
			expect( run( '\u{845b}\u{e0100}' ) ).toHaveProperty( 'blockMarkers', [ 7 ] ); // edible bean; surname + variation

			// NOTE: The next two run() strings _are not the same_ - check the encoding/raw bytes
			// The first is the character by itself
			// The second is the character plus the variation
			expect( run( '葛' ) ).toHaveProperty( 'blockMarkers', [ 3 ] ); // edible bean; surname
			expect( run( '葛󠄀' ) ).toHaveProperty( 'blockMarkers', [ 7 ] ); // edible bean; surname + variation

			// higher planes
			expect( run( '\u{24b62}' ) ).toHaveProperty( 'blockMarkers', [ 4 ] );
			expect( run( '𤭢' ) ).toHaveProperty( 'blockMarkers', [ 4 ] );

			// invalids
			expect( run( '\u{fffd}' ) ).toHaveProperty( 'blockMarkers', [ 3 ] ); // replacement character
			expect( run( '\u{80}' ) ).toHaveProperty( 'blockMarkers', [ 2 ] ); // unexpected continuation byte
			expect( run( '\u{fe}' ) ).toHaveProperty( 'blockMarkers', [ 2 ] ); // invalid byte

			// emoji
			expect( run( '\u{1f4a9}' ) ).toHaveProperty( 'blockMarkers', [ 4 ] ); // 💩 pile of poo
			expect( run( '💩' ) ).toHaveProperty( 'blockMarkers', [ 4 ] ); // 💩 pile of poo
			expect( run( '\u{2764}\u{fe0f}' ) ).toHaveProperty( 'blockMarkers', [ 6 ] ); // ❤️ black heart + variation 16
			expect( run( '❤️' ) ).toHaveProperty( 'blockMarkers', [ 6 ] ); // ❤️ black heart + variation 16
		} );
	} );
};

const hasPHP = 'test' === process.env.NODE_ENV ? ( () => {
	const process = require( 'child_process' ).spawnSync( 'php', [ '-r', 'echo 1;' ], { encoding: 'utf8' } );

	return process.status === 0 && process.stdout === '1';
} )() : false;

// skipping if `php` isn't available to us, such as in local dev without it
// skipping preserves snapshots while commenting out or simply
// not injecting the tests prompts `jest` to remove "obsolete snapshots"
// eslint-disable-next-line jest/no-disabled-tests
const makeTest = hasPHP ? ( ...args ) => describe( ...args ) : ( ...args ) => describe.skip( ...args );

export const phpTester = ( name, filename ) => makeTest(
	name,
	'test' === process.env.NODE_ENV ? jsTester( ( doc ) => JSON.parse( require( 'child_process' ).spawnSync(
		'php',
		[ '-f', filename ],
		{
			input: doc,
			encoding: 'utf8',
			timeout: 30 * 1000, // abort after 30 seconds, that's too long anyway
		}
	).stdout ) ) : () => {}
);
