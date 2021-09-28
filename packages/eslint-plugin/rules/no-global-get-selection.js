module.exports = {
	meta: {
		type: 'problem',
		schema: [],
	},
	create( context ) {
		return {
			'CallExpression[callee.object.name="window"][callee.property.name="getSelection"]'(
				node
			) {
				context.report( {
					node,
					message:
						'Avoid accessing the selection with a global. Use the ownerDocument.defaultView property on a node ref instead.',
				} );
			},
		};
	},
};
