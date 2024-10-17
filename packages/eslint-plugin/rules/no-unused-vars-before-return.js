/** @typedef {import('eslint').Scope.Scope} ESLintScope */
/** @typedef {import('eslint').Rule.RuleContext} ESLintRuleContext */
/** @typedef {import('estree').Node} ESTreeNode */

/**
 * Mapping of function scope objects to a set of identified JSX identifiers
 * within that scope.
 *
 * @type {WeakMap<ESLintScope,Set<ESTreeNode>>}
 */
const FUNCTION_SCOPE_JSX_IDENTIFIERS = new WeakMap();

/**
 * Returns the closest function scope for the current ESLint context object, or
 * undefined if it cannot be determined.
 *
 * @param {ESLintRuleContext} context ESLint context object.
 * @param {ESTreeNode}        node    ESLint tree node.
 *
 * @return {ESLintScope|undefined} Function scope, if known.
 */
function getClosestFunctionScope( context, node ) {
	let functionScope = context.sourceCode.getScope( node );
	while ( functionScope.type !== 'function' && functionScope.upper ) {
		functionScope = functionScope.upper;
	}

	return functionScope;
}

module.exports = /** @type {import('eslint').Rule} */ ( {
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
	/**
	 * @param {ESLintRuleContext} context Rule context.
	 */
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
			JSXIdentifier( node ) {
				// Currently, a scope's variable references does not include JSX
				// identifiers. Account for this by visiting JSX identifiers
				// first, and tracking them in a map per function scope, which
				// is later merged with the known variable references.
				const functionScope = getClosestFunctionScope( context, node );
				if ( ! functionScope ) {
					return;
				}

				if ( ! FUNCTION_SCOPE_JSX_IDENTIFIERS.has( functionScope ) ) {
					FUNCTION_SCOPE_JSX_IDENTIFIERS.set(
						functionScope,
						new Set()
					);
				}

				FUNCTION_SCOPE_JSX_IDENTIFIERS.get( functionScope ).add( node );
			},
			'ReturnStatement:exit'( node ) {
				const functionScope = getClosestFunctionScope( context, node );
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
							def.node.range[ 1 ] < node.range[ 1 ]
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
						continue;
					}

					// The first entry in `references` is the declaration
					// itself, which can be ignored.
					const identifiers = variable.references
						.slice( 1 )
						.map( ( reference ) => reference.identifier );

					// Merge with any JSX identifiers in scope, if any.
					if ( FUNCTION_SCOPE_JSX_IDENTIFIERS.has( functionScope ) ) {
						const jsxIdentifiers =
							FUNCTION_SCOPE_JSX_IDENTIFIERS.get( functionScope );

						identifiers.push( ...jsxIdentifiers );
					}

					const isUsedBeforeReturn = identifiers.some(
						( identifier ) =>
							identifier.range[ 1 ] < node.range[ 1 ]
					);

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
} );
