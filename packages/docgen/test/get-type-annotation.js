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

} );
