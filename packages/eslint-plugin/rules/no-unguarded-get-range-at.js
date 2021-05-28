module.exports = {
	meta: {
		type: 'problem',
		schema: [],
	},
	create( context ) {
		return {
			'CallExpression[callee.object.callee.property.name="getSelection"][callee.property.name="getRangeAt"]'(
				node
			) {
				context.report( {
					node,
					message: 'Avoid unguarded getRangeAt',
				} );
			},
		};
	},
};
