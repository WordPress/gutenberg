const VARIABLES = new Set(
	/** @type {const} */ ( [
		'GUTENBERG_PHASE',
		'IS_GUTENBERG_PLUGIN',
		'IS_WORDPRESS',
		'SCRIPT_DEBUG',
	] )
);

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		messages: {
			message:
				'`{{ name }}` should not be accessed from process.env. Use `globalThis.{{name}}`.',
		},
	},
	create( context ) {
		return {
			MemberExpression( node ) {
				const propertyNameOrValue = memberProperty( node );
				if ( ! propertyNameOrValue ) {
					return;
				}
				if ( ! VARIABLES.has( propertyNameOrValue ) ) {
					return;
				}

				if ( node.object.type !== 'MemberExpression' ) {
					return;
				}

				const obj = node.object;
				const envCandidateProperty = memberProperty( obj );
				if ( envCandidateProperty !== 'env' ) {
					return;
				}

				if (
					obj.object.type !== 'Identifier' ||
					obj.object.name !== 'process'
				) {
					return;
				}

				context.report( {
					node,
					messageId: 'message',
					data: { name: propertyNameOrValue },
				} );
			},
		};
	},
};

/**
 * @param {import('estree').MemberExpression} node
 */
function memberProperty( node ) {
	switch ( node.property.type ) {
		case 'Identifier':
			return node.property.name;
		case 'Literal':
			return node.property.value;
		case 'TemplateLiteral':
			if (
				! node.property.expressions.length &&
				node.property.quasis.length === 1
			) {
				return node.property.quasis[ 0 ].value.raw;
			}
	}
	return null;
}
