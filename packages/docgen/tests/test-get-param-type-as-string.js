/**
 * External dependencies.
 */
const test = require( 'tape' );

/**
 * Internal dependencies.
 */
const getParamType = require( '../src/get-param-type-as-string' );

test( 'getParamType from NameExpression', ( t ) => {
	const type = getParamType( {
		title: 'param',
		description: 'description',
		type: {
			type: 'NameExpression',
			name: 'Array',
		},
		name: 'paramName',
	} );
	t.equal( type, 'Array' );
	t.end();
} );

test( 'getParamType from NullableType', ( t ) => {
	const type = getParamType( {
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
	t.equal( type, 'string' );
	t.end();
} );

test( 'getParamType from RestType', ( t ) => {
	const type = getParamType( {
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
	t.equal( type, 'Function' );
	t.end();
} );

test( 'getParamType from RestType with UnionType', ( t ) => {
	const type = getParamType( {
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
	t.equal( type, 'Object | string' );
	t.end();
} );
