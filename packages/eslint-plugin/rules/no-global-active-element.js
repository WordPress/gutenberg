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
					message:
						'Avoid accessing the active element with a global. Use the ownerDocument property on a node ref instead.',
				} );
			},
		};
	},
};
