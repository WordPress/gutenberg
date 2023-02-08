/**
 * Internal dependencies
 */
import { patternMatch } from '../utils/router';

describe( 'patternMatch', () => {
	it( 'should return undefined if not pattern is matched', () => {
		const result = patternMatch( '/test', [ { id: 'route', path: '/' } ] );
		expect( result ).toBeUndefined();
	} );

	it( 'should match a pattern with no params', () => {
		const result = patternMatch( '/test', [
			{ id: 'route', path: '/test' },
		] );
		expect( result ).toEqual( { id: 'route', params: {} } );
	} );

	it( 'should match a pattern with params', () => {
		const result = patternMatch( '/test/123', [
			{ id: 'route', path: '/test/:id' },
		] );
		expect( result ).toEqual( { id: 'route', params: { id: '123' } } );
	} );

	it( 'should match the first pattern in case of ambiguity', () => {
		const result = patternMatch( '/test/123', [
			{ id: 'route1', path: '/test/:id' },
			{ id: 'route2', path: '/test/123' },
		] );
		expect( result ).toEqual( { id: 'route1', params: { id: '123' } } );
	} );

	it( 'should match a pattern with optional params', () => {
		const result = patternMatch( '/test', [
			{ id: 'route', path: '/test/:id?' },
		] );
		expect( result ).toEqual( { id: 'route', params: {} } );
	} );
} );
