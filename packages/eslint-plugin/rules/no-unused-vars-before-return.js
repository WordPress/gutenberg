module.exports = {
	meta: {
		type: 'problem',
		schema: [],
	},
	create( context ) {
		return {
			ReturnStatement( node ) {
				let functionScope = context.getScope();
				while ( functionScope.type !== 'function' && functionScope.upper ) {
					functionScope = functionScope.upper;
				}

				if ( ! functionScope ) {
					return;
				}

				for ( const variable of functionScope.variables ) {
					const isAssignmentCandidate = variable.defs.some( ( def ) => {
						return (
							def.node.type === 'VariableDeclarator' &&
							// Allow declarations which are not initialized.
							def.node.init &&
							// Target function calls as "expensive".
							def.node.init.type === 'CallExpression' &&
							// Allow unused if part of an object destructuring.
							def.node.id.type !== 'ObjectPattern' &&
							// Only target assignments preceding `return`.
							def.node.end < node.end
						);
					} );

					if ( ! isAssignmentCandidate ) {
						continue;
					}

					// The first entry in `references` is the declaration
					// itself, which can be ignored.
					const isUsedBeforeReturn = variable.references.slice( 1 ).some( ( reference ) => {
						return reference.identifier.end < node.end;
					} );

					if ( isUsedBeforeReturn ) {
						continue;
					}

					context.report(
						node,
						`Declared variable \`${ variable.name }\` is unused before a return path`
					);
				}
			},
		};
	},
};
