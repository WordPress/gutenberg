// Babel plugin that looks for `core-js` imports (or requires)
// and replaces them with magic comments to mark the file as
// depending on wp-polyfill.
function replacePolyfills() {
	return {
		pre() {
			this.hasAddedPolyfills = false;
		},
		visitor: {
			Program: {
				exit( path ) {
					if ( this.hasAddedPolyfills ) {
						// Add magic comment to top of file.
						path.addComment( 'leading', ' wp:polyfill ' );
					}
				},
			},
			// Handle `import` syntax.
			ImportDeclaration( path ) {
				const source = path?.node?.source;
				const name = source?.value || '';

				// Look for imports from `core-js`.
				if ( name.startsWith( 'core-js/' ) ) {
					// Remove import.
					path.remove();
					this.hasAddedPolyfills = true;
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
					// Remove import.
					path.remove();
					this.hasAddedPolyfills = true;
				}
			},
		},
	};
}

module.exports = replacePolyfills;
