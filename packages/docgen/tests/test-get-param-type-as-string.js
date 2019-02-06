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
