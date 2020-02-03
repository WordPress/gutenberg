module.exports = {
	meta: {
		type: 'problem',
		schema: [
			{
				type: 'object',
				properties: {
					excludePattern: {
						type: 'string',
					},
				},
				additionalProperties: false,
			},
		],
	},
	create( context ) {
		const options = context.options[ 0 ] || {};
		const { excludePattern } = options;

		/**
		 * Given an Espree VariableDeclarator node, returns true if the node
		 * can be exempted from consideration as unused, or false otherwise. A
		 * node can be exempt if it destructures to multiple variables, since
		 * those other variables may be used prior to the return statement. A
		 * future enhancement could validate that they are in-fact referenced.
		 *
		 * @param {Object} node Node to test.
		 *
		 * @return {boolean} Whether declarator is emempt from consideration.
		 */
		function isExemptObjectDestructureDeclarator( node ) {
			return (
				node.id.type === 'ObjectPattern' &&
				node.id.properties.length > 1
			);
		}

		return {
			ReturnStatement( node ) {
				let functionScope = context.getScope();
				while (
					functionScope.type !== 'function' &&
					functionScope.upper
				) {
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
							! isExemptObjectDestructureDeclarator( def.node ) &&
							// Only target assignments preceding `return`.
							def.node.end < node.end
						);
					} );

					if ( ! declaratorCandidate ) {
						continue;
					}

					if (
						excludePattern !== undefined &&
						new RegExp( excludePattern ).test(
							declaratorCandidate.node.init.callee.name
						)
					) {
						return;
					}

					// The first entry in `references` is the declaration
					// itself, which can be ignored.
					const isUsedBeforeReturn = variable.references
						.slice( 1 )
						.some( ( reference ) => {
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
