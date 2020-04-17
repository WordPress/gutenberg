const UNSPECIFIED_OBJECT_ERROR =
	"Any object within a block's attributes must have its properties defined.";

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
 * Please edit me
 *
 * @param {Object} node    The ObjectExpression containing a `type` property.
 * @param {Object} context The eslint context object.
 */
function testIsNotPlainObjectType( node, context ) {
	const jsonSchemaPropertiesDeclaration = node.properties.find(
		( candidate ) =>
			candidate.key.type === 'Literal' &&
			candidate.key.value === 'properties'
	);

	if ( ! jsonSchemaPropertiesDeclaration ) {
		context.report( node, UNSPECIFIED_OBJECT_ERROR );
	}
}

module.exports = {
	meta: {
		type: 'problem',
		schema: [],
	},
	create( context ) {
		return {
			Literal( node ) {
				// Bypass any object property that isn't `type: 'object'`.
				if (
					node.value !== 'object' ||
					! ( node.parent && node.parent.type === 'Property' ) ||
					! (
						node.parent.key.type === 'Literal' &&
						node.parent.key.value === 'type'
					)
				) {
					return;
				}

				// Capture the object expression in which property `type:
				// 'object'` was found.
				const attributeObjectExpression = node.parent.parent;

				// Bypass any object expression that isn't nested in the value of
				// a property of key `attributes`.
				const attributesPropertyAncestor = findParent(
					attributeObjectExpression,
					( candidate ) =>
						candidate.type === 'Property' &&
						candidate.key.type === 'Literal' &&
						candidate.key.value === 'attributes'
				);
				if ( ! attributesPropertyAncestor ) {
					return;
				}

				testIsNotPlainObjectType( attributeObjectExpression, context );
			},
		};
	},
};
