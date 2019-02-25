/**
 * External dependencies.
 */
const test = require( 'tape' );

/**
 * Internal dependencies.
 */
const getType = require( '../src/get-type-as-string' );

test( 'JSDoc - getType from NameExpression', ( t ) => {
	const type = getType( {
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

test( 'JSDoc - getType from AllLiteral', ( t ) => {
	const type = getType( {
		title: 'param',
		description: 'description',
		type: {
			type: 'AllLiteral',
		},
		name: 'paramName',
	} );
	t.equal( type, '*' );
	t.end();
} );

test( 'JSDoc - getType with applications', ( t ) => {
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
	t.equal( type, 'Array<Object,String>' );
	t.end();
} );

test( 'JSDoc - getType from NullableType', ( t ) => {
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
	t.equal( type, '?string' );
	t.end();
} );

test( 'JSDoc - getType from RestType', ( t ) => {
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
	t.equal( type, '...Function' );
	t.end();
} );

test( 'JSDoc - getType from RestType with UnionType', ( t ) => {
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
	t.equal( type, '...(Object|string)' );
	t.end();
} );
