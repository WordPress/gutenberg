/**
 * Internal dependencies.
 */
const getType = require( '../get-type-as-string' );

describe( 'getType from JSDoc', () => {
	it( 'NameExpression', () => {
		const type = getType( 'Array' );
		expect( type ).toBe( 'Array' );
	} );

	it( 'AllLiteral', () => {
		const type = getType( '*' );
		expect( type ).toBe( '*' );
	} );

	it( 'Applications', () => {
		const type = getType( 'Record<string, number>' );
		expect( type ).toBe( 'Record<string, number>' );
	} );

	it( 'JSDoc style array', () => {
		const type = getType( 'Array.<string>' );
		expect( type ).toBe( 'Array<string>' );
	} );

	it( 'NullableType', () => {
		const type = getType( 'string?' );
		expect( type ).toBe( '?string' );
	} );

	it( 'optional type', () => {
		const type = getType( 'string', true );
		expect( type ).toBe( '[string]' );
	} );

	it( 'RestType', () => {
		const type = getType( '...Function' );
		expect( type ).toBe( '...Function' );
	} );

	it( 'Union', () => {
		const type = getType( 'null|undefined' );
		expect( type ).toBe( 'null|undefined' );
	} );

	it( 'RestType with UnionType', () => {
		const type = getType( '...(Object|string)' );
		expect( type ).toBe( '...(Object|string)' );
	} );
} );
