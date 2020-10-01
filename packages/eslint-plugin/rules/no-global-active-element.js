module.exports = {
	meta: {
		type: 'problem',
		schema: [],
	},
	create( context ) {
		return {
			'MemberExpression[object.name="document"][property.name="activeElement"]'(
				node
			) {
				context.report( {
					node,
					message: 'Avoid global active element',
				} );
			},
		};
	},
};
