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
 * Tests whether the GUTENBERG_PHASE variable is accessed via the global window
 * object, triggering a violation if not.
 *
 * @example
 * ```js
 * // good
 * if ( window.GUTENBERG_PHASE === 2 ) {
 *
 * // bad
 * if ( GUTENBERG_PHASE === 2 ) {
 * ```
 *
 * @param {Object} node    The GUTENBERG_PHASE identifier node.
 * @param {Object} context The eslint context object.
 */
function testIsAccessedViaWindowObject( node, context ) {
	const parent = node.parent;

	if (
		parent &&
		node.type === 'Identifier' &&
		parent.type === 'MemberExpression' &&
		parent.object.name === 'window' &&
		! parent.computed

	) {
		return;
	}

	context.report(
		node,
		'The `GUTENBERG_PHASE` constant should only be accessed as a property of the `window` object using dot notation.',
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
 * if ( window.GUTENBERG_PHASE === 2 ) {
 *
 * // bad
 * if ( window.GUTENBERG_PHASE >= '2' ) {
 * ```
 *
 * @param {Object} node    The GUTENBERG_PHASE identifier node.
 * @param {Object} context The eslint context object.
 */
function testIsUsedInStrictBinaryExpression( node, context ) {
	const parent = findParent( node, ( candidate ) => candidate.type === 'BinaryExpression' );

	if ( parent ) {
		const comparisonNode = node.parent.type === 'MemberExpression' ? node.parent : node;

		// Test for window.GUTENBERG_PHASE === <number> or <number> === window.GUTENBERG_PHASE
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
 * if ( window.GUTENBERG_PHASE === 2 ) {
 *
 * // bad
 * const isFeatureActive = window.GUTENBERG_PHASE === 2;
 * ```
 *
 * @param {Object} node    The GUTENBERG_PHASE identifier node.
 * @param {Object} context The eslint context object.
 */
function testIsUsedInIfStatement( node, context ) {
	const ifParent = findParent( node, ( candidate ) => candidate.type === 'IfStatement' );
	const binaryParent = findParent( node, ( candidate ) => candidate.type === 'BinaryExpression' );

	if ( ifParent &&
		binaryParent &&
		ifParent.test &&
		ifParent.test.start === binaryParent.start &&
		ifParent.test.end === binaryParent.end
	) {
		return;
	}

	context.report(
		node,
		'The `GUTENBERG_PHASE` constant should only be used as part of an expression that is the only condition of an if statement.',
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

				testIsAccessedViaWindowObject( node, context );
				testIsUsedInStrictBinaryExpression( node, context );
				testIsUsedInIfStatement( node, context );
			},
			Literal( node ) {
				// Bypass any identifiers with a node value different to `GUTENBERG_PHASE`.
				if ( node.value !== 'GUTENBERG_PHASE' ) {
					return;
				}

				if ( node.parent && node.parent.type === 'MemberExpression' ) {
					testIsAccessedViaWindowObject( node, context );
				}
			},
		};
	},
};
