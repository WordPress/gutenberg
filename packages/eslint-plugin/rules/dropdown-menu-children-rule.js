module.exports = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'Ensure only allowed elements are children of DropdownMenu, including those returned by render props',
			category: 'Best Practices',
			recommended: false,
		},
		schema: [],
		messages: {
			invalidChild:
				"'{{child}}' is not an allowed child of 'DropdownMenu'.",
		},
	},
	create( context ) {
		const allowedChildren = [
			'MenuGroup',
			'MenuItemsChoice',
			'AspectRatioGroup',
			'MenuItem',
		];

		function checkChildren( children ) {
			children.forEach( ( child ) => {
				if (
					child.type === 'JSXElement' &&
					! allowedChildren.includes( child.openingElement.name.name )
				) {
					context.report( {
						node: child,
						messageId: 'invalidChild',
						data: {
							child: child.openingElement.name.name,
						},
					} );
				}
			} );
		}

		function handleRenderProp( node ) {
			if ( node.body && node.body.type === 'JSXElement' ) {
				checkChildren( [ node.body ] );
			} else if ( node.body && node.body.type === 'BlockStatement' ) {
				node.body.body.forEach( ( statement ) => {
					if (
						statement.type === 'ReturnStatement' &&
						statement.argument
					) {
						if ( statement.argument.type === 'JSXElement' ) {
							checkChildren( [ statement.argument ] );
						}
					}
				} );
			}
		}

		return {
			JSXElement( node ) {
				if ( node.openingElement.name.name === 'DropdownMenu' ) {
					node.children.forEach( ( child ) => {
						if ( child.type === 'JSXElement' ) {
							checkChildren( [ child ] );
						} else if (
							child.type === 'JSXExpressionContainer' &&
							child.expression.type === 'ArrowFunctionExpression'
						) {
							handleRenderProp( child.expression );
						} else if (
							child.type === 'JSXExpressionContainer' &&
							child.expression.type === 'FunctionExpression'
						) {
							handleRenderProp( child.expression.body );
						}
					} );
				}
			},
		};
	},
};
