module.exports = {
	meta: {
		type: 'problem',
		schema: [],
	},
	create( context ) {
		return {
			CallExpression( node ) {
				const { callee } = node;
				const { object, property } = callee;

				if ( ! object || ! property ) {
					return;
				}

				if ( object.name !== 'document' && object.name !== 'window' ) {
					return;
				}

				if (
					property.name !== 'addEventListener' &&
					property.name !== 'removeEventListener'
				) {
					return;
				}

				context.report( {
					node,
					message:
						'Avoid using globals in combination with (add|remove)EventListener. Use a `ownerDocument` or `defaultView` on a ref instead.',
				} );
			},
		};
	},
};
