/**
 * Internal dependencies
 */
import { patternMatch, findParent } from '../utils/router';

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

	it( 'should return an array of matches for the same param', () => {
		const result = patternMatch( '/some/basic/route', [
			{ id: 'route', path: '/:test+' },
		] );
		expect( result ).toEqual( {
			id: 'route',
			params: { test: [ 'some', 'basic', 'route' ] },
		} );
	} );
} );

describe( 'findParent', () => {
	it( 'should return undefined if no parent is found', () => {
		const result = findParent( '/test', [
			{ id: 'route', path: '/test' },
		] );
		expect( result ).toBeUndefined();
	} );

	it( 'should return the parent path', () => {
		const result = findParent( '/test', [
			{ id: 'route1', path: '/test' },
			{ id: 'route2', path: '/' },
		] );
		expect( result ).toEqual( '/' );
	} );

	it( 'should return to another parent path', () => {
		const result = findParent( '/test/123', [
			{ id: 'route1', path: '/test/:id' },
			{ id: 'route2', path: '/test' },
		] );
		expect( result ).toEqual( '/test' );
	} );

	it( 'should return the parent path with params', () => {
		const result = findParent( '/test/123/456', [
			{ id: 'route1', path: '/test/:id/:subId' },
			{ id: 'route2', path: '/test/:id' },
		] );
		expect( result ).toEqual( '/test/123' );
	} );

	it( 'should return the parent path with optional params', () => {
		const result = findParent( '/test/123', [
			{ id: 'route', path: '/test/:id?' },
		] );
		expect( result ).toEqual( '/test' );
	} );

	it( 'should return the grand parent if no parent found', () => {
		const result = findParent( '/test/123/456', [
			{ id: 'route1', path: '/test/:id/:subId' },
			{ id: 'route2', path: '/test' },
		] );
		expect( result ).toEqual( '/test' );
	} );

	it( 'should return the root when no grand parent found', () => {
		const result = findParent( '/test/nested/path', [
			{ id: 'route1', path: '/other-path' },
			{ id: 'route2', path: '/yet-another-path' },
			{ id: 'root', path: '/' },
		] );
		expect( result ).toEqual( '/' );
	} );

	it( 'should return undefined when no potential parent found', () => {
		const result = findParent( '/test/nested/path', [
			{ id: 'route1', path: '/other-path' },
			{ id: 'route2', path: '/yet-another-path' },
		] );
		expect( result ).toBeUndefined();
	} );

	it( 'should return undefined for non supported paths', () => {
		const result = findParent( 'this-is-a-path', [
			{ id: 'route', path: '/' },
		] );
		expect( result ).toBeUndefined();
	} );
} );
