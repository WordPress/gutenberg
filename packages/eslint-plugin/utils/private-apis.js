/**
 * @typedef {{ privateApisSources: Map<string, string>, trackedUnlockImports: Set<string> }} PrivateApisState
 */

/**
 * @return {PrivateApisState} Mutable state for tracking `unlock` and `privateApis` imports.
 */
function createPrivateApisState() {
	return {
		privateApisSources: new Map(),
		trackedUnlockImports: new Set(),
	};
}

/**
 * @param {PrivateApisState}                 state
 * @param {import('estree').ImportSpecifier} specifier
 */
function trackUnlockImport( state, specifier ) {
	if ( specifier.imported.name === 'unlock' ) {
		state.trackedUnlockImports.add( specifier.local.name );
	}
}

/**
 * @param {PrivateApisState}                 state
 * @param {import('estree').ImportSpecifier} specifier
 * @param {string}                           source
 */
function trackPrivateApisImport( state, specifier, source ) {
	if ( specifier.imported.name === 'privateApis' ) {
		state.privateApisSources.set( specifier.local.name, source );
	}
}

/**
 * @param {import('estree').CallExpression|import('estree').Expression|null} node
 * @param {import('eslint').SourceCode}                                      sourceCode
 * @param {ReadonlySet<string>}                                              trackedUnlockImports
 * @return {node is import('estree').CallExpression} Whether this is an `unlock()` call with one argument.
 */
function isUnlockCall( node, sourceCode, trackedUnlockImports ) {
	if (
		node &&
		node.type === 'CallExpression' &&
		node.callee.type === 'Identifier' &&
		node.arguments.length === 1
	) {
		if ( ! trackedUnlockImports.has( node.callee.name ) ) {
			return false;
		}

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
 * @return {string|null} Property name.
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
 * @param {import('estree').VariableDeclarator} node
 * @param {import('eslint').SourceCode}         sourceCode
 * @param {PrivateApisState}                    state
 * @return {{ source: string, properties: import('estree').Property[] }|null} Unlock destructuring context.
 */
function getUnlockDestructuring( node, sourceCode, state ) {
	if ( node.parent.type !== 'VariableDeclaration' ) {
		return null;
	}

	if (
		node.id.type !== 'ObjectPattern' ||
		! isUnlockCall( node.init, sourceCode, state.trackedUnlockImports )
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
	trackUnlockImport,
	trackPrivateApisImport,
	isUnlockCall,
	getPropertyName,
	getUnlockDestructuring,
};
