/**
 * Traverse up through the chain of parent AST nodes returning the first parent
 * the predicate returns a truthy value for.
 *
 * @param {Object}   sourceNode The AST node to search from.
 * @param {Function} predicate  A predicate invoked for each parent.
 *
 * @return {?Object } The first encountered parent node where the predicate
 *                    returns a truthy value.
 */
function findParent( sourceNode, predicate ) {
	if ( ! sourceNode.parent ) {
		return;
	}

	if ( predicate( sourceNode.parent ) ) {
		return sourceNode.parent;
	}

	return findParent( sourceNode.parent, predicate );
}

/**
 * Tests whether the IS_GUTENBERG_PLUGIN variable is accessed via
 * `process.env.IS_GUTENBERG_PLUGIN`.
 *
 * @example
 * ```js
 * // good
 * if ( process.env.IS_GUTENBERG_PLUGIN ) {
 *
 * // bad
 * if ( IS_GUTENBERG_PLUGIN ) {
 * ```
 *
 * @param {Object} node    The IS_GUTENBERG_PLUGIN identifier node.
 * @param {Object} context The eslint context object.
 */
function isAccessedViaProcessEnv( node, context ) {
	const parent = node.parent;

	if (
		parent &&
		parent.type === 'MemberExpression' &&
		context.getSource( parent ) === 'process.env.IS_GUTENBERG_PLUGIN'
	) {
		return true;
	}

	return false;
}

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
 * @param {Object} node    The IS_GUTENBERG_PLUGIN identifier node.
 * @param {Object} context The eslint context object.
 */
function isUsedInIfOrTernary( node, context ) {
	const conditionalParent = findParent( node, ( candidate ) =>
		[ 'IfStatement', 'ConditionalExpression' ].includes( candidate.type )
	);

	const goodTests = [
		'process.env.IS_GUTENBERG_PLUGIN',
		'! process.env.IS_GUTENBERG_PLUGIN',
	];

	if (
		conditionalParent &&
		goodTests.includes( context.getSource( conditionalParent.test ) )
	) {
		return true;
	}

	return false;
}

const ACCESS_ERROR =
	'The `IS_GUTENBERG_PLUGIN` constant should be accessed using `process.env.IS_GUTENBERG_PLUGIN`.';
const IF_ERROR =
	'The `process.env.IS_GUTENBERG_PLUGIN` constant should only be used as the condition in an if statement or ternary expression.';

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
	},
	create( context ) {
		return {
			Identifier( node ) {
				// Bypass any identifiers with a node name different to `IS_GUTENBERG_PLUGIN`.
				if ( node.name !== 'IS_GUTENBERG_PLUGIN' ) {
					return;
				}

				if ( ! isAccessedViaProcessEnv( node, context ) ) {
					context.report( node, ACCESS_ERROR );
				}
				if ( ! isUsedInIfOrTernary( node, context ) ) {
					context.report( node, IF_ERROR );
				}
			},
			// Check for literals, e.g. when 'IS_GUTENBERG_PLUGIN' is used as a string via something like 'window[ 'IS_GUTENBERG_PLUGIN' ]'.
			Literal( node ) {
				// Bypass any identifiers with a node value different to `IS_GUTENBERG_PLUGIN`.
				if ( node.value !== 'IS_GUTENBERG_PLUGIN' ) {
					return;
				}

				if ( node.parent && node.parent.type === 'MemberExpression' ) {
					if ( ! isAccessedViaProcessEnv( node, context ) ) {
						context.report( node, ACCESS_ERROR );
					}
					if ( ! isUsedInIfOrTernary( node, context ) ) {
						context.report( node, IF_ERROR );
					}
				}
			},
		};
	},
};
