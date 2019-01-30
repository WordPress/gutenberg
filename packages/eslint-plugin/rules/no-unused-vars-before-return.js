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
					const declaratorCandidate = variable.defs.find( ( def ) => {
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

					if ( ! declaratorCandidate ) {
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
						declaratorCandidate.node,
						'Variables should not be assigned until just prior its first reference. ' +
						'An early return statement may leave this variable unused.'
					);
				}
			},
		};
	},
};
