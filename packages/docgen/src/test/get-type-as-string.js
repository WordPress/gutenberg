/**
 * Internal dependencies.
 */
const getType = require( '../get-type-as-string' );

describe( 'getType from JSDoc', () => {
	it( 'NameExpression', () => {
		const type = getType( {
			title: 'param',
			description: 'description',
			type: {
				type: 'NameExpression',
				name: 'Array',
			},
			name: 'paramName',
		} );
		expect( type ).toBe( 'Array' );
	} );

	it( 'AllLiteral', () => {
		const type = getType( {
			title: 'param',
			description: 'description',
			type: {
				type: 'AllLiteral',
			},
			name: 'paramName',
		} );
		expect( type ).toBe( '*' );
	} );

	it( 'Applications', () => {
		const type = getType( {
			title: 'param',
			description: 'description',
			type: {
				type: 'TypeApplication',
				expression: {
					type: 'NameExpression',
					name: 'Array',
				},
				applications: [
					{
						type: 'NameExpression',
						name: 'Object',
					},
					{
						type: 'NameExpression',
						name: 'String',
					},
				],
			},
		} );
		expect( type ).toBe( 'Array<Object,String>' );
	} );

	it( 'NullableType', () => {
		const type = getType( {
			title: 'param',
			description: 'description',
			type: {
				type: 'NullableType',
				expression: {
					type: 'NameExpression',
					name: 'string',
				},
				prefix: true,
			},
			name: 'paramName',
		} );
		expect( type ).toBe( '?string' );
	} );

	it( 'RestType', () => {
		const type = getType( {
			title: 'param',
			description: 'description',
			type: {
				type: 'RestType',
				expression: {
					type: 'NameExpression',
					name: 'Function',
				},
			},
			name: 'paramName',
		} );
		expect( type ).toBe( '...Function' );
	} );

	it( 'RestType with UnionType', () => {
		const type = getType( {
			title: 'param',
			description: 'description',
			type: {
				type: 'RestType',
				expression: {
					type: 'UnionType',
					elements: [
						{ type: 'NameExpression', name: 'Object' },
						{ type: 'NameExpression', name: 'string' },
					],
				},
			},
			name: 'paramName',
		} );
		expect( type ).toBe( '...(Object|string)' );
	} );
} );
