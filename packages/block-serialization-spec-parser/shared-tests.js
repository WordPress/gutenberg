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

	describe( 'innerBlock placemarkers', () => {
		test( 'innerContent exists', () => {
			expect( parse( 'test' )[ 0 ] ).toHaveProperty( 'innerContent', [ 'test' ] );
			expect( parse( '<!-- wp:void /-->' )[ 0 ] ).toHaveProperty( 'innerContent', [] );
		} );

		test( 'innerContent contains innerHTML', () => {
			expect( parse( '<!-- wp:block -->Inner<!-- /wp:block -->' )[ 0 ] ).toHaveProperty( 'innerContent', [ 'Inner' ] );
		} );

		test( 'block locations become null', () => {
			expect( parse( '<!-- wp:block --><!-- wp:void /--><!-- /wp:block -->' )[ 0 ] ).toHaveProperty( 'innerContent', [ null ] );
		} );

		test( 'HTML soup appears after blocks', () => {
			expect( parse( '<!-- wp:block --><!-- wp:void /-->After<!-- /wp:block -->' )[ 0 ] ).toHaveProperty( 'innerContent', [ null, 'After' ] );
		} );

		test( 'HTML soup appears before blocks', () => {
			expect( parse( '<!-- wp:block -->Before<!-- wp:void /--><!-- /wp:block -->' )[ 0 ] ).toHaveProperty( 'innerContent', [ 'Before', null ] );
		} );

		test( 'blocks follow each other', () => {
			expect( parse( '<!-- wp:block --><!-- wp:void /--><!-- wp:void /--><!-- /wp:block -->' )[ 0 ] ).toHaveProperty( 'innerContent', [ null, null ] );
		} );
	} );

	describe( 'attack vectors', () => {
		test( 'really long JSON attribute sections', () => {
			const length = 100000;
			const as = 'a'.repeat( length );
			let parsed;

			expect( () => parsed = parse( `<!-- wp:fake {"a":"${ as }"} /-->` )[ 0 ] ).not.toThrow();
			expect( parsed.attrs.a ).toHaveLength( length );
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
	'test' === process.env.NODE_ENV ? jsTester( ( doc ) => {
		const process = require( 'child_process' ).spawnSync(
			'php',
			[ '-f', filename ],
			{
				input: doc,
				encoding: 'utf8',
				timeout: 30 * 1000, // abort after 30 seconds, that's too long anyway
			}
		);

		if ( process.status !== 0 ) {
			throw new Error( process.stderr || process.stdout );
		}

		try {
			return JSON.parse( process.stdout );
		} catch ( e ) {
			throw new Error( 'failed to parse JSON:\n' + process.stdout );
		}
	} ) : () => {}
);
