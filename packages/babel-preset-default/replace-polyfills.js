// Babel plugin that looks for `core-js` imports (or requires)
// and replaces them with `@wordpress/polyfill`.
function replacePolyfills() {
	return {
		pre() {
			this.hasAddedPolyfills = false;
		},
		visitor: {
			// Handle `import` syntax.
			ImportDeclaration( path ) {
				const source = path?.node?.source;
				const name = source?.value || '';

				// Look for imports from `core-js`.
				if ( name.startsWith( 'core-js/' ) ) {
					if ( this.hasAddedPolyfills ) {
						// Remove duplicate import.
						path.remove();
					} else {
						// Replace with `@wordpress/polyfill`.
						source.value = '@wordpress/polyfill';
						this.hasAddedPolyfills = true;
					}
				}
			},

			// Handle `require` syntax.
			CallExpression( path ) {
				const callee = path?.node?.callee;
				const arg = path?.node?.arguments[ 0 ];

				if (
					! callee ||
					! arg ||
					callee.type !== 'Identifier' ||
					callee.name !== 'require'
				) {
					return;
				}

				// Look for requires for `core-js`.
				if (
					arg.type === 'StringLiteral' &&
					arg.value.startsWith( 'core-js/' )
				) {
					if ( this.hasAddedPolyfills ) {
						// Remove duplicate import.
						path.remove();
					} else {
						// Replace with `@wordpress/polyfill`.
						arg.value = '@wordpress/polyfill';
						this.hasAddedPolyfills = true;
					}
				}
			},
		},
	};
}

module.exports = replacePolyfills;
