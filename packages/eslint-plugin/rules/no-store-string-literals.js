module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		messages: {
			doNotUseStringLiteral:
				'Do not use string literals for accessing stores ; import the store and use the store object or store name constant instead',
		},
	},
	create( context ) {
		return {
			'CallExpression[callee.name=/^(select|dispatch|useDispatch)$/][arguments.0.type="Literal"]'(
				node
			) {
				context.report( {
					node,
					messageId: 'doNotUseStringLiteral',
				} );
			},
			'CallExpression[callee.object.name=/^controls|registry$/][callee.property.name=/^(select|dispatch|resolveSelect)$/][arguments.0.type="Literal"]'(
				node
			) {
				context.report( {
					node,
					messageId: 'doNotUseStringLiteral',
				} );
			},
		};
	},
};
