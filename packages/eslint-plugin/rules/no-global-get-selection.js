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
					message: 'Avoid global selection getting',
				} );
			},
		};
	},
};
