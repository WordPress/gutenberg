/**
 * Shared helpers for ESLint rules that inspect `unlock( privateApis )` usage.
 */

/**
 * @typedef {{ privateApisSources: Map<string, string> }} PrivateApisState
 */

/**
 * @return {PrivateApisState} Mutable state for tracking `unlock` and `privateApis` imports.
 */
function createPrivateApisState() {
	return {
		privateApisSources: new Map(),
	};
}

/**
 * Records imported `privateApis` → package source when requested.
 *
 * @param {PrivateApisState}                 state
 * @param {import('estree').ImportSpecifier} specifier
 * @param {string}                           source
 * @param {boolean}                          trackPrivateApis
 */
function trackPrivateApisSpecifier(
	state,
	specifier,
	source,
	trackPrivateApis
) {
	const name = specifier.imported.name;
	if ( trackPrivateApis && name === 'privateApis' ) {
		state.privateApisSources.set( specifier.local.name, source );
	}
}

/**
 * @param {import('estree').CallExpression|import('estree').Expression|null} node
 * @param {import('eslint').SourceCode}                                      sourceCode
 * @return {node is import('estree').CallExpression} Whether this is an `unlock()` call with one argument.
 */
function isUnlockCall( node, sourceCode ) {
	if (
		node &&
		node.type === 'CallExpression' &&
		node.callee.type === 'Identifier' &&
		node.callee.name === 'unlock' &&
		node.arguments.length === 1
	) {
		const { references } = sourceCode.getScope( node.callee );
		const reference = references.find(
			( currentReference ) => currentReference.identifier === node.callee
		);

		return !! reference?.resolved?.defs.some(
			( definition ) => definition.type === 'ImportBinding'
		);
	}

	return false;
}

/**
 * @param {import('estree').Expression|import('estree').PrivateIdentifier} key
 * @return {string|null} Static name of an object pattern property key.
 */
function getPropertyName( key ) {
	if ( key.type === 'Identifier' ) {
		return key.name;
	}

	if ( key.type === 'Literal' ) {
		return String( key.value );
	}

	return null;
}

/**
 * Parses `const { … } = unlock( privateApis )` and returns the package source and properties.
 *
 * @param {import('estree').VariableDeclarator} node
 * @param {import('eslint').SourceCode}         sourceCode
 * @param {PrivateApisState}                    state
 * @return {{ source: string, properties: import('estree').Property[] }|null} Unlock destructuring context.
 */
function getUnlockDestructuring( node, sourceCode, state ) {
	if (
		node.id.type !== 'ObjectPattern' ||
		! isUnlockCall( node.init, sourceCode )
	) {
		return null;
	}

	const privateApisIdentifier = node.init.arguments[ 0 ];
	if ( privateApisIdentifier.type !== 'Identifier' ) {
		return null;
	}

	const source = state.privateApisSources.get( privateApisIdentifier.name );
	if ( ! source ) {
		return null;
	}

	const properties = node.id.properties.filter(
		( property ) => property.type === 'Property' && ! property.computed
	);

	return { source, properties };
}

module.exports = {
	createPrivateApisState,
	trackPrivateApisSpecifier,
	getPropertyName,
	getUnlockDestructuring,
};
