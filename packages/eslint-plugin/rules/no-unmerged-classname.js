/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		messages: {
			noUnmergedClassname:
				'The `className` prop should be destructured from props and merged into the `className` attribute to ensure it is forwarded to the underlying element.',
		},
	},
	create( context ) {
		return {
			JSXOpeningElement( node ) {
				const classNameAttr = node.attributes.find(
					( attr ) =>
						attr.type === 'JSXAttribute' &&
						attr.name?.name === 'className'
				);

				if ( ! classNameAttr ) {
					return;
				}

				const hasSpread = node.attributes.some(
					( attr ) => attr.type === 'JSXSpreadAttribute'
				);

				if ( ! hasSpread ) {
					return;
				}

				const func = getEnclosingFunction( node );
				if ( ! func ) {
					return;
				}

				const propsParam = func.params[ 0 ];
				if ( ! propsParam ) {
					return;
				}

				// Props passed as a plain identifier (e.g. `function Foo( props )`)
				// and spread directly — className can never be merged.
				if ( propsParam.type === 'Identifier' ) {
					const spreadMatchesParam = node.attributes.some(
						( attr ) =>
							attr.type === 'JSXSpreadAttribute' &&
							attr.argument.type === 'Identifier' &&
							attr.argument.name === propsParam.name
					);
					if ( spreadMatchesParam ) {
						context.report( {
							node: classNameAttr,
							messageId: 'noUnmergedClassname',
						} );
					}
					return;
				}

				if ( propsParam.type !== 'ObjectPattern' ) {
					return;
				}

				const hasRestElement = propsParam.properties.some(
					( prop ) => prop.type === 'RestElement'
				);
				if ( ! hasRestElement ) {
					return;
				}

				const classNameDestructured = propsParam.properties.some(
					( prop ) =>
						prop.type === 'Property' &&
						prop.key?.name === 'className'
				);

				if ( ! classNameDestructured ) {
					context.report( {
						node: classNameAttr,
						messageId: 'noUnmergedClassname',
					} );
				}
			},
		};
	},
};

/**
 * Walk up the AST to find the enclosing function node.
 *
 * @param {import('estree').Node} node
 * @return {import('estree').Function | null} The enclosing function, or null.
 */
function getEnclosingFunction( node ) {
	let current = node;
	while ( current.parent ) {
		current = current.parent;
		if (
			current.type === 'FunctionDeclaration' ||
			current.type === 'FunctionExpression' ||
			current.type === 'ArrowFunctionExpression'
		) {
			return current;
		}
	}
	return null;
}
