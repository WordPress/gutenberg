/**
 * Internal dependencies
 */
import { buildTermsTree } from '../terms';

describe( 'buildTermsTree()', () => {
	it( 'Should return same array as input with null parent and empty children added if parent is never specified.', () => {
		const input = Object.freeze( [
			{ id: 2232, dummy: true },
			{ id: 2245, dummy: true },
		] );
		const output = Object.freeze( [
			{ id: 2232, parent: null, children: [], dummy: true },
			{ id: 2245, parent: null, children: [], dummy: true },
		] );
		const termsTreem = buildTermsTree( input );
		expect( termsTreem ).toEqual( output );
	} );
	it( 'Should return same array as input with empty children added if all the elements are top level', () => {
		const input = Object.freeze( [
			{ id: 2232, parent: 0, dummy: true },
			{ id: 2245, parent: 0, dummy: false },
		] );
		const output = [
			{ id: 2232, parent: 0, children: [], dummy: true },
			{ id: 2245, parent: 0, children: [], dummy: false },
		];
		const termsTreem = buildTermsTree( input );
		expect( termsTreem ).toEqual( output );
	} );
	it( 'Should return element with its child if a child exists', () => {
		const input = Object.freeze( [
			{ id: 2232, parent: 0 },
			{ id: 2245, parent: 2232 },
		] );
		const output = [
			{ id: 2232, parent: 0, children: [
				{ id: 2245, parent: 2232, children: [] },
			] },
		];
		const termsTreem = buildTermsTree( input );
		expect( termsTreem ).toEqual( output );
	} );
	it( 'Should return elements with multiple children and elements with no children', () => {
		const input = Object.freeze( [
			{ id: 2232, parent: 0 },
			{ id: 2245, parent: 2232 },
			{ id: 2249, parent: 0 },
			{ id: 2246, parent: 2232 },
		] );
		const output = [
			{ id: 2232, parent: 0, children: [
				{ id: 2245, parent: 2232, children: [] },
				{ id: 2246, parent: 2232, children: [] },
			] },
			{ id: 2249, parent: 0, children: [] },
		];
		const termsTreem = buildTermsTree( input );
		expect( termsTreem ).toEqual( output );
	} );
} );
