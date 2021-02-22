/**
 * Internal dependencies
 */
const getTypeAnnotation = require( '../lib/get-type-annotation' );

describe( 'Type annotations', () => {
	it( 'are taken from JSDoc if any', () => {
		const tag = {
			tag: 'param',
			type: 'number',
		};
		const node = {};
		const result = getTypeAnnotation( tag, node );
		expect( result ).toBe( 'number' );
	} );

	it( "returns empty if no JSDoc type and TS data can't be inferred either", () => {
		const tag = {
			tag: 'unknown',
		};
		const node = {};
		const result = getTypeAnnotation( tag, node );
		expect( result ).toBe( '' );
	} );
} );
