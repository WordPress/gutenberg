export const jsTester = ( parse ) => () => {
	describe( 'output structure', () => {
		test( 'output is an array', () => {
			expect( parse( '' ) ).toEqual( expect.any( Array ) );
			expect( parse( 'test' ) ).toEqual( expect.any( Array ) );
			expect( parse( '<!-- wp:void /-->' ) ).toEqual(
				expect.any( Array )
			);
			expect(
				parse( '<!-- wp:block --><!-- wp:inner /--><!-- /wp:block -->' )
			).toEqual( expect.any( Array ) );
			expect( parse( '<!-- wp:first /--><!-- wp:second /-->' ) ).toEqual(
				expect.any( Array )
			);
		} );

		test( 'parses blocks of various types', () => {
			expect( parse( '<!-- wp:void /-->' )[ 0 ] ).toHaveProperty(
				'blockName',
				'core/void'
			);
			expect( parse( '<!-- wp:void {} /-->' )[ 0 ] ).toHaveProperty(
				'blockName',
				'core/void'
			);
			expect(
				parse( '<!-- wp:void {"value":true} /-->' )[ 0 ]
			).toHaveProperty( 'blockName', 'core/void' );
			expect( parse( '<!-- wp:void {"a":{}} /-->' )[ 0 ] ).toHaveProperty(
				'blockName',
				'core/void'
			);
			expect(
				parse( '<!-- wp:void { "value" : true } /-->' )[ 0 ]
			).toHaveProperty( 'blockName', 'core/void' );
			expect(
				parse( '<!-- wp:void {\n\t"value" : true\n} /-->' )[ 0 ]
			).toHaveProperty( 'blockName', 'core/void' );
			expect(
				parse( '<!-- wp:block --><!-- /wp:block -->' )[ 0 ]
			).toHaveProperty( 'blockName', 'core/block' );
			expect(
				parse( '<!-- wp:block {} --><!-- /wp:block -->' )[ 0 ]
			).toHaveProperty( 'blockName', 'core/block' );
			expect(
				parse(
					'<!-- wp:block {"value":true} --><!-- /wp:block -->'
				)[ 0 ]
			).toHaveProperty( 'blockName', 'core/block' );
			expect(
				parse( '<!-- wp:block {} -->inner<!-- /wp:block -->' )[ 0 ]
			).toHaveProperty( 'blockName', 'core/block' );
			expect(
				parse(
					'<!-- wp:block {"value":{"a" : "true"}} -->inner<!-- /wp:block -->'
				)[ 0 ]
			).toHaveProperty( 'blockName', 'core/block' );
		} );

		test( 'blockName is namespaced string (except freeform)', () => {
			expect( parse( 'freeform has null name' )[ 0 ] ).toHaveProperty(
				'blockName',
				null
			);
			expect( parse( '<!-- wp:more /-->' )[ 0 ] ).toHaveProperty(
				'blockName',
				'core/more'
			);
			expect( parse( '<!-- wp:core/more /-->' )[ 0 ] ).toHaveProperty(
				'blockName',
				'core/more'
			);
			expect( parse( '<!-- wp:my/more /-->' )[ 0 ] ).toHaveProperty(
				'blockName',
				'my/more'
			);
		} );

		test( 'JSON attributes are key/value object', () => {
			expect( parse( 'freeform has empty attrs' )[ 0 ] ).toHaveProperty(
				'attrs',
				{}
			);
			expect( parse( '<!-- wp:void /-->' )[ 0 ] ).toHaveProperty(
				'attrs',
				{}
			);
			expect( parse( '<!-- wp:void {} /-->' )[ 0 ] ).toHaveProperty(
				'blockName',
				'core/void'
			);
			expect( parse( '<!-- wp:void {} /-->' )[ 0 ] ).toHaveProperty(
				'attrs',
				{}
			);
			expect(
				parse( '<!-- wp:void {"key": "value"} /-->' )[ 0 ]
			).toHaveProperty( 'attrs', {
				key: 'value',
			} );
			expect(
				parse( '<!-- wp:block --><!-- /wp:block -->' )[ 0 ]
			).toHaveProperty( 'attrs', {} );
			expect(
				parse( '<!-- wp:block {} --><!-- /wp:block -->' )[ 0 ]
			).toHaveProperty( 'attrs', {} );
			expect(
				parse(
					'<!-- wp:block {"key": "value"} --><!-- /wp:block -->'
				)[ 0 ]
			).toHaveProperty( 'attrs', { key: 'value' } );
		} );

		test( 'innerBlocks is a list', () => {
			expect(
				parse( 'freeform has empty innerBlocks' )[ 0 ]
			).toHaveProperty( 'innerBlocks', [] );
			expect( parse( '<!-- wp:void /-->' )[ 0 ] ).toHaveProperty(
				'innerBlocks',
				[]
			);
			expect(
				parse( '<!-- wp:block --><!-- /wp:block -->' )[ 0 ]
			).toHaveProperty( 'innerBlocks', [] );

			const withInner = parse(
				'<!-- wp:block --><!-- wp:inner /--><!-- /wp:block -->'
			)[ 0 ];
			expect( withInner ).toHaveProperty(
				'innerBlocks',
				expect.any( Array )
			);
			expect( withInner.innerBlocks ).toHaveLength( 1 );

			const withTwoInner = parse(
				'<!-- wp:block -->a<!-- wp:first /-->b<!-- wp:second /-->c<!-- /wp:block -->'
			)[ 0 ];
			expect( withTwoInner ).toHaveProperty(
				'innerBlocks',
				expect.any( Array )
			);
			expect( withTwoInner.innerBlocks ).toHaveLength( 2 );
		} );

		test( 'innerHTML is a string', () => {
			expect( parse( 'test' )[ 0 ] ).toHaveProperty(
				'innerHTML',
				expect.any( String )
			);
			expect( parse( '<!-- wp:test /-->' )[ 0 ] ).toHaveProperty(
				'innerHTML',
				expect.any( String )
			);
			expect(
				parse( '<!-- wp:test --><!-- /wp:test -->' )[ 0 ]
			).toHaveProperty( 'innerHTML', expect.any( String ) );
			expect(
				parse( '<!-- wp:test -->test<!-- /wp:test -->' )[ 0 ]
			).toHaveProperty( 'innerHTML', expect.any( String ) );
		} );
	} );

	describe( 'generic tests', () => {
		test( 'parse() accepts inputs with multiple Reusable blocks', () => {
			expect(
				parse(
					'<!-- wp:block {"ref":313} /--><!-- wp:block {"ref":482} /-->'
				)
			).toEqual( [
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
			expect( parse( '<!-- wp:block /-->' ) ).toEqual(
				parse( '<!-- wp:block --><!-- /wp:block -->' )
			);

			expect( parse( '<!-- wp:my/bus { "is": "fast" } /-->' ) ).toEqual(
				parse(
					'<!-- wp:my/bus { "is": "fast" } --><!-- /wp:my/bus -->'
				)
			);
		} );

		test( 'should grab HTML soup before block openers', () => {
			[
				'<p>Break me</p><!-- wp:block /-->',
				'<p>Break me</p><!-- wp:block --><!-- /wp:block -->',
			].forEach( ( input ) =>
				expect( parse( input ) ).toEqual( [
					expect.objectContaining( { innerHTML: '<p>Break me</p>' } ),
					expect.objectContaining( {
						blockName: 'core/block',
						innerHTML: '',
					} ),
				] )
			);
		} );

		test( 'should grab HTML soup before inner block openers', () =>
			[
				'<!-- wp:outer --><p>Break me</p><!-- wp:block /--><!-- /wp:outer -->',
				'<!-- wp:outer --><p>Break me</p><!-- wp:block --><!-- /wp:block --><!-- /wp:outer -->',
			].forEach( ( input ) =>
				expect( parse( input ) ).toEqual( [
					expect.objectContaining( {
						innerBlocks: [
							expect.objectContaining( {
								blockName: 'core/block',
								innerHTML: '',
							} ),
						],
						innerHTML: '<p>Break me</p>',
					} ),
				] )
			) );

		test( 'should grab HTML soup after blocks', () =>
			[
				'<!-- wp:block /--><p>Break me</p>',
				'<!-- wp:block --><!-- /wp:block --><p>Break me</p>',
			].forEach( ( input ) =>
				expect( parse( input ) ).toEqual( [
					expect.objectContaining( {
						blockName: 'core/block',
						innerHTML: '',
					} ),
					expect.objectContaining( { innerHTML: '<p>Break me</p>' } ),
				] )
			) );
	} );

	describe( 'innerBlock placemarkers', () => {
		test( 'innerContent exists', () => {
			expect( parse( 'test' )[ 0 ] ).toHaveProperty( 'innerContent', [
				'test',
			] );
			expect( parse( '<!-- wp:void /-->' )[ 0 ] ).toHaveProperty(
				'innerContent',
				[]
			);
		} );

		test( 'innerContent contains innerHTML', () => {
			expect(
				parse( '<!-- wp:block -->Inner<!-- /wp:block -->' )[ 0 ]
			).toHaveProperty( 'innerContent', [ 'Inner' ] );
		} );

		test( 'block locations become null', () => {
			expect(
				parse(
					'<!-- wp:block --><!-- wp:void /--><!-- /wp:block -->'
				)[ 0 ]
			).toHaveProperty( 'innerContent', [ null ] );
		} );

		test( 'HTML soup appears after blocks', () => {
			expect(
				parse(
					'<!-- wp:block --><!-- wp:void /-->After<!-- /wp:block -->'
				)[ 0 ]
			).toHaveProperty( 'innerContent', [ null, 'After' ] );
		} );

		test( 'HTML soup appears before blocks', () => {
			expect(
				parse(
					'<!-- wp:block -->Before<!-- wp:void /--><!-- /wp:block -->'
				)[ 0 ]
			).toHaveProperty( 'innerContent', [ 'Before', null ] );
		} );

		test( 'blocks follow each other', () => {
			expect(
				parse(
					'<!-- wp:block --><!-- wp:void /--><!-- wp:void /--><!-- /wp:block -->'
				)[ 0 ]
			).toHaveProperty( 'innerContent', [ null, null ] );
		} );
	} );

	describe( 'attack vectors', () => {
		test( 'really long JSON attribute sections', () => {
			const length = 100000;
			const as = 'a'.repeat( length );
			let parsed;

			expect(
				() =>
					( parsed = parse(
						`<!-- wp:fake {"a":"${ as }"} /-->`
					)[ 0 ] )
			).not.toThrow();
			expect( parsed.attrs.a ).toHaveLength( length );
		} );

		describe( 'invalid block comment syntax', () => {
			test( 'extra space after void closer', () => {
				let parsed;

				expect(
					() => ( parsed = parse( '<!-- wp:block / -->' )[ 0 ] )
				).not.toThrow();
				expect( parsed.blockName ).toBeNull();
			} );
		} );
	} );
};

const hasPHP =
	'test' === process.env.NODE_ENV
		? ( () => {
				const process = require( 'child_process' ).spawnSync(
					'php',
					[ '-r', 'echo 1;' ],
					{
						encoding: 'utf8',
					}
				);

				return process.status === 0 && process.stdout === '1';
		  } )()
		: false;

// skipping if `php` isn't available to us, such as in local dev without it
// skipping preserves snapshots while commenting out or simply
// not injecting the tests prompts `jest` to remove "obsolete snapshots"
const makeTest = hasPHP
	? // eslint-disable-next-line jest/valid-describe
	  ( ...args ) => describe( ...args )
	: // eslint-disable-next-line jest/no-disabled-tests, jest/valid-describe
	  ( ...args ) => describe.skip( ...args );

export const phpTester = ( name, filename ) =>
	makeTest(
		name,
		'test' === process.env.NODE_ENV
			? jsTester( ( doc ) => {
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
						/*
						 * Due to an issue with PHP's json_encode() serializing an empty associative array
						 * as an empty list `[]` we're manually replacing the already-encoded bit here.
						 *
						 * This is an issue with the test runner, not with the parser.
						 */
						return JSON.parse(
							process.stdout.replace(
								/"attrs":\s*\[\]/g,
								'"attrs":{}'
							)
						);
					} catch ( e ) {
						throw new Error(
							'failed to parse JSON:\n' + process.stdout
						);
					}
			  } )
			: () => {}
	);
