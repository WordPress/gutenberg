/**
 * Internal dependencies
 */
import { preloadScriptModules } from '../script-modules';

jest.mock( '../dynamic-importmap', () => ( {
	...jest.requireActual( '../dynamic-importmap' ),
	preloadWithMap: jest.fn( () => Promise.resolve( {} ) ),
} ) );

describe( 'preloadScriptModules', () => {
	it( 'should only preload modules with data-wp-router-options containing loadOnClientNavigation: true', () => {
		const doc = document.implementation.createHTMLDocument();

		// Module with loadOnClientNavigation: true
		const module1 = doc.createElement( 'script' );
		module1.type = 'module';
		module1.src = 'https://example.com/module1.js';
		module1.setAttribute(
			'data-wp-router-options',
			JSON.stringify( { loadOnClientNavigation: true } )
		);

		// Module with loadOnClientNavigation: false
		const module2 = doc.createElement( 'script' );
		module2.type = 'module';
		module2.src = 'https://example.com/module2.js';
		module2.setAttribute(
			'data-wp-router-options',
			JSON.stringify( { loadOnClientNavigation: false } )
		);

		// Module without data-wp-router-options
		const module3 = doc.createElement( 'script' );
		module3.type = 'module';
		module3.src = 'https://example.com/module3.js';

		// Module with data-wp-router-options but without loadOnClientNavigation
		const module4 = doc.createElement( 'script' );
		module4.type = 'module';
		module4.src = 'https://example.com/module4.js';
		module4.setAttribute(
			'data-wp-router-options',
			JSON.stringify( { otherOption: true } )
		);

		doc.head.appendChild( module1 );
		doc.head.appendChild( module2 );
		doc.head.appendChild( module3 );
		doc.head.appendChild( module4 );

		const result = preloadScriptModules( doc );

		// Only module1 should be preloaded
		expect( result.length ).toBe( 1 );
	} );

	it( 'should handle invalid JSON in data-wp-router-options gracefully', () => {
		const doc = document.implementation.createHTMLDocument();

		const module = doc.createElement( 'script' );
		module.type = 'module';
		module.src = 'https://example.com/module.js';
		module.setAttribute( 'data-wp-router-options', 'invalid json' );

		doc.head.appendChild( module );

		const result = preloadScriptModules( doc );

		// Should not throw and should return empty array
		expect( result.length ).toBe( 0 );
	} );
} );
