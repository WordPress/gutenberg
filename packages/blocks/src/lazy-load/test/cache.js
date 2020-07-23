/**
 * External dependencies
 */
import { range } from 'lodash';

/**
 * Internal dependencies
 */
import { LazyLoadCache } from '../cache';

describe( 'LazyLoadCache', () => {
	describe( 'constructor', () => {
		it( 'should initialize the list of pre-loaded scripts from the document', () => {
			const preloaded = [];
			range( 3 ).forEach( ( n ) => {
				const scriptHandle = `wp-script-${ n }`;
				preloaded.push( scriptHandle );
				const id = `${ scriptHandle }-js`;
				const element = document.createElement( 'script' );
				element.id = id;
				document.head.appendChild( element );
			} );

			const cache = new LazyLoadCache();

			preloaded.forEach( ( scriptHandle ) => {
				expect( cache.scripts.has( scriptHandle ) ).toBe( true );
			} );
		} );
	} );

	describe( 'scripts', () => {
		it( 'should be protected', () => {
			const cache = new LazyLoadCache( [] );
			expect( () => ( cache.scripts = new Set() ) ).toThrow();
		} );
	} );
} );
