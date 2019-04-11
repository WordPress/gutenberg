/**
 * Traverse up through the chain of parent AST nodes returning the first parent
 * the predicate returns a truthy value for.
 *
 * @param {Object}   sourceNode The AST node to search from.
 * @param {function} predicate  A predicate invoked for each parent.
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
 * Tests whether the GUTENBERG_PHASE variable is accessed via
 * `process.env.GUTENBERG_PHASE`.
 *
 * @example
 * ```js
 * // good
 * if ( process.env.GUTENBERG_PHASE === 2 ) {
 *
 * // bad
 * if ( GUTENBERG_PHASE === 2 ) {
 * ```
 *
 * @param {Object} node    The GUTENBERG_PHASE identifier node.
 * @param {Object} context The eslint context object.
 */
function testIsAccessedViaProcessEnv( node, context ) {
	const parent = node.parent;

	if (
		parent &&
		parent.type === 'MemberExpression' &&
		context.getSource( parent ) === 'process.env.GUTENBERG_PHASE'

	) {
		return;
	}

	context.report(
		node,
		'The `GUTENBERG_PHASE` constant should be accessed using `process.env.GUTENBERG_PHASE`.',
	);
}

/**
 * Tests whether the GUTENBERG_PHASE variable is used in a strict binary
 * equality expression in a comparison with a number, triggering a
 * violation if not.
 *
 * @example
 * ```js
 * // good
 * if ( process.env.GUTENBERG_PHASE === 2 ) {
 *
 * // bad
 * if ( process.env.GUTENBERG_PHASE >= '2' ) {
 * ```
 *
 * @param {Object} node    The GUTENBERG_PHASE identifier node.
 * @param {Object} context The eslint context object.
 */
function testIsUsedInStrictBinaryExpression( node, context ) {
	const parent = findParent( node, ( candidate ) => candidate.type === 'BinaryExpression' );

	if ( parent ) {
		const comparisonNode = node.parent.type === 'MemberExpression' ? node.parent : node;

		// Test for process.env.GUTENBERG_PHASE === <number> or <number> === process.env.GUTENBERG_PHASE
		const hasCorrectOperator = [ '===', '!==' ].includes( parent.operator );
		const hasCorrectOperands = (
			( parent.left === comparisonNode && typeof parent.right.value === 'number' ) ||
			( parent.right === comparisonNode && typeof parent.left.value === 'number' )
		);

		if ( hasCorrectOperator && hasCorrectOperands ) {
			return;
		}
	}

	context.report(
		node,
		'The `GUTENBERG_PHASE` constant should only be used in a strict equality comparison with a primitive number.',
	);
}

/**
 * Tests whether the GUTENBERG_PHASE variable is used as the condition for an
 * if statement, triggering a violation if not.
 *
 * @example
 * ```js
 * // good
 * if ( process.env.GUTENBERG_PHASE === 2 ) {
 *
 * // bad
 * const isFeatureActive = process.env.GUTENBERG_PHASE === 2;
 * ```
 *
 * @param {Object} node    The GUTENBERG_PHASE identifier node.
 * @param {Object} context The eslint context object.
 */
function testIsUsedInIfOrTernary( node, context ) {
	const conditionalParent = findParent(
		node,
		( candidate ) => [ 'IfStatement', 'ConditionalExpression' ].includes( candidate.type )
	);
	const binaryParent = findParent( node, ( candidate ) => candidate.type === 'BinaryExpression' );

	if ( conditionalParent &&
		binaryParent &&
		conditionalParent.test &&
		conditionalParent.test.start === binaryParent.start &&
		conditionalParent.test.end === binaryParent.end
	) {
		return;
	}

	context.report(
		node,
		'The `GUTENBERG_PHASE` constant should only be used as part of the condition in an if statement or ternary expression.',
	);
}

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
	},
	create( context ) {
		return {
			Identifier( node ) {
				// Bypass any identifiers with a node name different to `GUTENBERG_PHASE`.
				if ( node.name !== 'GUTENBERG_PHASE' ) {
					return;
				}

				testIsAccessedViaProcessEnv( node, context );
				testIsUsedInStrictBinaryExpression( node, context );
				testIsUsedInIfOrTernary( node, context );
			},
			Literal( node ) {
				// Bypass any identifiers with a node value different to `GUTENBERG_PHASE`.
				if ( node.value !== 'GUTENBERG_PHASE' ) {
					return;
				}

				if ( node.parent && node.parent.type === 'MemberExpression' ) {
					testIsAccessedViaProcessEnv( node, context );
				}
			},
		};
	},
};
