/* eslint-disable jsdoc/check-tag-names -- Package names containing @ are not JSDoc tags */
/**
 * Wrapper around @babel/eslint-parser that ensures compatibility with
 * ESLint v10+. ESLint v10 expects `scopeManager.addGlobals()` which is
 * available in eslint-scope v9 bundled with ESLint v10, but
 * @babel/eslint-parser v7 uses an older eslint-scope that does not have
 * this method. This wrapper patches the scope manager when needed.
 *
 * TODO: Remove this wrapper when upgrading to @babel/eslint-parser v8+,
 * which adds native ESLint v10 support (requires @babel/core v8).
 * See https://github.com/babel/babel/issues/17791
 */
/* eslint-enable jsdoc/check-tag-names */
const babelParser = require( '@babel/eslint-parser' );

module.exports = {
	meta: {
		...babelParser.meta,
		name: '@wordpress/babel-eslint-parser-compat',
	},

	parse( code, options ) {
		return babelParser.parse( code, options );
	},

	parseForESLint( code, options ) {
		const result = babelParser.parseForESLint( code, options );

		// Patch scopeManager if addGlobals is missing (ESLint v10 compat).
		if (
			result.scopeManager &&
			typeof result.scopeManager.addGlobals !== 'function'
		) {
			result.scopeManager.addGlobals = function addGlobals( names ) {
				const globalScope = this.scopes[ 0 ];
				if ( ! globalScope ) {
					return;
				}
				for ( const name of names ) {
					globalScope.__defineGeneric(
						name,
						globalScope.set,
						globalScope.variables,
						null,
						null
					);
				}

				// Resolve through references that match the new globals.
				const namesSet = new Set( names );
				globalScope.through = globalScope.through.filter(
					( reference ) => {
						if ( namesSet.has( reference.identifier.name ) ) {
							const variable = globalScope.set.get(
								reference.identifier.name
							);
							reference.resolved = variable;
							variable.references.push( reference );
							return false;
						}
						return true;
					}
				);
			};
		}

		return result;
	},
};
