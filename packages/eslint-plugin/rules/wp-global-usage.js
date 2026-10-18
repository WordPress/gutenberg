const NAMES = new Set(
	/** @type {const} */ ( [
		'IS_GUTENBERG_PLUGIN',
		'IS_WORDPRESS_CORE',
		'SCRIPT_DEBUG',
	] )
);

/**
 * Tests whether the IS_GUTENBERG_PLUGIN variable is used as the condition for an
 * if statement or ternary, triggering a violation if not.
 *
 * @example
 * ```js
 * // good
 * if ( process.env.IS_GUTENBERG_PLUGIN ) {
 *
 * // bad
 * const isFeatureActive = process.env.IS_GUTENBERG_PLUGIN;
 * ```
 *
 * @param {import('estree').Node} node The IS_GUTENBERG_PLUGIN identifier node.
 */
function isUsedInConditional( node ) {
	/** @type {import('estree').Node|undefined} */
	let current = node;

	// Simple negation is the only expression allowed in the conditional:
	// if ( ! globalThis.SCRIPT_DEBUG ) {}
	// const D = ! globalThis.SCRIPT_DEBUG ? 'yes' : 'no';
	if (
		current.parent.type === 'UnaryExpression' &&
		current.parent.operator === '!'
	) {
		current = current.parent;
	}

	// Check if the current node is the test of a conditional

	/** @type {import('estree').Node|undefined} */
	const parent = current.parent;

	if ( parent.type === 'IfStatement' && parent.test === current ) {
		return true;
	}
	if ( parent.type === 'ConditionalExpression' && parent.test === current ) {
		return true;
	}
	return false;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
	meta: {
		type: 'problem',
		schema: [],
		fixable: true,
		messages: {
			usedOutsideConditional:
				'`globalThis.{{ name }}` should only be used as the condition in an if statement or ternary expression.',
			usedWithoutGlobalThis:
				'`{{ name }}` should not be used directly. Use `globalThis.{{ name }}`.',
		},
	},
	create( context ) {
		return {
			Identifier( node ) {
				// Bypass any identifiers with a node name different to `IS_GUTENBERG_PLUGIN`.
				if ( ! NAMES.has( node.name ) ) {
					return;
				}

				if ( node.parent.type === 'Property' ) {
					return;
				}

				if ( node.parent.type !== 'MemberExpression' ) {
					context.report( {
						node,
						messageId: 'usedWithoutGlobalThis',
						data: { name: node.name },
						fix( fixer ) {
							return fixer.replaceText(
								node,
								`globalThis.${ node.name }`
							);
						},
					} );

					if ( ! isUsedInConditional( node ) ) {
						context.report( {
							node,
							messageId: 'usedOutsideConditional',
							data: {
								name: node.name,
							},
						} );
					}
					return;
				}

				if (
					node.parent.object.type === 'Identifier' &&
					node.parent.object.name !== 'globalThis'
				) {
					context.report( {
						node,
						messageId: 'usedWithoutGlobalThis',
						data: { name: node.name },
						fix( fixer ) {
							if ( node.parent.object.name === 'window' ) {
								return fixer.replaceText(
									node.parent,
									`globalThis.${ node.name }`
								);
							}
						},
					} );
				} else if ( ! isUsedInConditional( node.parent ) ) {
					context.report( {
						node,
						messageId: 'usedOutsideConditional',
						data: {
							name: node.name,
						},
					} );
				}
			},

			// Check for literals, e.g. when 'IS_GUTENBERG_PLUGIN' is used as a string via something like 'window[ 'IS_GUTENBERG_PLUGIN' ]'.
			Literal( node ) {
				// Bypass any identifiers with a node value different to `IS_GUTENBERG_PLUGIN`.
				if ( ! NAMES.has( node.value ) ) {
					return;
				}

				if ( node.parent.type !== 'MemberExpression' ) {
					return;
				}

				if (
					node.parent.object.type === 'Identifier' &&
					node.parent.object.name !== 'globalThis'
				) {
					context.report( {
						node,
						messageId: 'usedWithoutGlobalThis',
						data: { name: node.value },
						fix( fixer ) {
							if ( node.parent.object.name === 'window' ) {
								return fixer.replaceText(
									node.parent,
									`globalThis.${ node.value }`
								);
							}
						},
					} );
				} else if ( ! isUsedInConditional( node.parent ) ) {
					context.report( {
						node,
						messageId: 'usedOutsideConditional',
						data: {
							name: node.value,
						},
					} );
				}
			},
		};
	},
};
