import metadata from '../../packages/block-library/src/embed/block.json';
import variations from '../../packages/block-library/src/embed/variations';

/**
 * The embed provider list lives in `block.json`, where the editor's
 * `findMoreSuitableBlock()` and the server-side conversion read the same
 * declaration. These tests keep that single source whole: the declared data
 * has to be usable by both runtimes, and the JavaScript entries must stay
 * confined to what only JavaScript can hold, so the split cannot drift back
 * into two competing tables.
 */
describe( 'The embed providers declared in block.json', () => {
	const declared = metadata.variations;

	it( 'declares every provider the JavaScript entries decorate, in the same order', () => {
		// The first pattern to match wins, and the merged list keeps the
		// declared order, so the order is part of the declaration.
		expect( variations.map( ( { name } ) => name ) ).toEqual(
			declared.map( ( { name } ) => name )
		);
	} );

	it( 'keeps the JavaScript entries to what only JavaScript can hold', () => {
		// Everything expressible as data lives in `block.json`. An entry
		// here holds an icon — and the `isActive` the module attaches — so a
		// provider added in one place cannot fork from the other.
		for ( const variation of variations ) {
			expect( {
				[ variation.name ]: Object.keys( variation ).sort(),
			} ).toEqual( {
				[ variation.name ]: [ 'icon', 'isActive', 'name' ],
			} );
		}
	} );

	it( 'declares patterns both runtimes can compile', () => {
		// A declared pattern is a regular expression source without
		// delimiters or flags: the editor compiles it with `RegExp` and the
		// server with PCRE, both case-insensitively, so it must stay within
		// the syntax the two share — no delimiters, no inline flags.
		for ( const { name, patterns = [] } of declared ) {
			for ( const pattern of patterns ) {
				expect( typeof pattern ).toBe( 'string' );
				expect( () => new RegExp( pattern, 'i' ) ).not.toThrow();
				expect( { [ name ]: pattern } ).not.toEqual( {
					[ name ]: expect.stringMatching( /^[#/~(]\?/ ),
				} );
			}
		}
	} );

	it( 'gives every matchable provider the attributes its block stores', () => {
		for ( const { name, patterns, attributes } of declared ) {
			if ( ! patterns?.length ) {
				continue;
			}

			expect( { [ name ]: attributes?.providerNameSlug } ).toEqual( {
				[ name ]: expect.any( String ),
			} );
		}
	} );

	it( 'records only oEmbed types the block can save', () => {
		// `save` writes the type into a class name, so a value the editor
		// would never produce would be markup it cannot validate.
		for ( const { attributes } of declared ) {
			expect( [ undefined, 'rich', 'photo', 'video', 'link' ] ).toContain(
				attributes?.type
			);
		}
	} );

	it( 'declares a type only for a provider a pattern can attribute', () => {
		for ( const { name, patterns, attributes } of declared ) {
			if ( undefined === attributes?.type ) {
				continue;
			}

			expect( { [ name ]: patterns?.length } ).toEqual( {
				[ name ]: expect.any( Number ),
			} );
			expect( patterns.length ).toBeGreaterThan( 0 );
		}
	} );
} );
