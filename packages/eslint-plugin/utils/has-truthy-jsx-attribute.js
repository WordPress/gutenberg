/**
 * Check if a JSX/React attribute exists and has a truthy value.
 *
 * This utility analyzes JSX attribute nodes from an ESLint AST to determine
 * if a specific attribute is present with a truthy value.
 *
 * Handles the following patterns:
 * - Boolean shorthand: `<Component prop />` → truthy
 * - Explicit true: `<Component prop={true} />` → truthy
 * - Explicit false: `<Component prop={false} />` → NOT truthy
 * - String values: `<Component prop="value" />` → truthy (if non-empty)
 * - Dynamic expressions: `<Component prop={someVar} />` → assumed truthy
 *
 * @param {Array}  attributes - Array of JSX attribute nodes from the ESLint AST
 * @param {string} attrName   - The attribute name to check
 * @return {boolean} Whether the attribute exists with a truthy value
 */
function hasTruthyJsxAttribute( attributes, attrName ) {
	const attr = attributes.find(
		( a ) => a.type === 'JSXAttribute' && a.name && a.name.name === attrName
	);

	if ( ! attr ) {
		return false;
	}

	// Boolean attribute without value (e.g., `<Button disabled />`)
	if ( attr.value === null ) {
		return true;
	}

	// Expression like `prop={true}` or `prop={false}`
	if (
		attr.value.type === 'JSXExpressionContainer' &&
		attr.value.expression.type === 'Literal'
	) {
		return attr.value.expression.value !== false;
	}

	// String value - truthy if not empty
	if ( attr.value.type === 'Literal' ) {
		return Boolean( attr.value.value );
	}

	// For any other expression (variables, function calls, etc.),
	// assume it could be truthy since we can't statically analyze it
	return true;
}

module.exports = { hasTruthyJsxAttribute };
