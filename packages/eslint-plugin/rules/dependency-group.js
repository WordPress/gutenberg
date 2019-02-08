module.exports = {
	meta: {
		type: 'layout',
		docs: {
			description: 'Enforce dependencies docblocks formatting',
			url: 'https://github.com/WordPress/gutenberg/blob/master/packages/eslint-plugin/docs/rules/dependency-group.md',
		},
		schema: [],
	},
	create( context ) {
		const comments = context.getSourceCode().getAllComments();

		/**
		 * Locality classification of an import, one of "External",
		 * "WordPress", "Internal".
		 *
		 * @typedef {string} WPPackageLocality
		 */

		/**
		 * Given an import source string, returns the locality classification
		 * of the import sort.
		 *
		 * @param {string} source Import source string.
		 *
		 * @return {WPPackageLocality} Package locality.
		 */
		function getPackageLocality( source ) {
			if ( source.startsWith( '.' ) ) {
				return 'Internal';
			} else if ( source.startsWith( '@wordpress/' ) ) {
				return 'WordPress';
			}

			return 'External';
		}

		/**
		 * Returns true if the given comment node satisfies a desired locality,
		 * or false otherwise.
		 *
		 * @param {espree.Node}       node     Comment node to check.
		 * @param {WPPackageLocality} locality Desired package locality.
		 *
		 * @return {boolean} Whether comment node satisfies locality.
		 */
		function isLocalityDependencyBlock( node, locality ) {
			const { type, value } = node;
			if ( type !== 'Block' ) {
				return false;
			}

			// (Temporary) Tolerances:
			// - Normalize `/**` and `/*`
			// - Case insensitive "Dependencies" vs. "dependencies"
			// - Ending period
			// - "Node" dependencies as an alias for External

			if ( locality === 'External' ) {
				locality = '(External|Node)';
			}

			const pattern = new RegExp( `^\\*?\\n \\* ${ locality } [dD]ependencies\\.?\\n $` );
			return pattern.test( value );
		}

		/**
		 * Returns true if the given node occurs prior in code to a reference,
		 * or false otherwise.
		 *
		 * @param {espree.Node} node      Node to test being before reference.
		 * @param {espree.Node} reference Node against which to compare.
		 *
		 * @return {boolean} Whether node occurs before reference.
		 */
		function isBefore( node, reference ) {
			return node.start < reference.start;
		}

		/**
		 * Returns true if a given node is preceded by a comment block
		 * satisfying a locality requirement, or false otherwise.
		 *
		 * @param {espree.Node}       node     Node to test.
		 * @param {WPPackageLocality} locality Desired package locality.
		 *
		 * @return {boolean} Whether node preceded by locality comment block.
		 */
		function isPrecededByDependencyBlock( node, locality ) {
			return comments.some( ( comment ) => {
				return isLocalityDependencyBlock( comment, locality ) && isBefore( comment, node );
			} );
		}

		/**
		 * Given an import source string and node occurrence from which the
		 * source is derived, tests that the package source is satisfied by a
		 * preceding comment block of appropriate locality.
		 *
		 * @param {string}      source Import source string.
		 * @param {espree.Node} node   Node from which import source derived.
		 */
		function testPackage( source, node ) {
			const locality = getPackageLocality( source );
			if ( ! isPrecededByDependencyBlock( node, locality ) ) {
				context.report( {
					node,
					message: `Expected preceding "${ locality } dependencies" comment block`,
				} );
			}
		}

		return {
			Program( node ) {
				// Since we only care to enforce imports which occur at the
				// top-level scope, match on Program and test its children,
				// rather than matching the import nodes directly.
				node.body.forEach( ( child ) => {
					switch ( child.type ) {
						case 'ImportDeclaration':
							testPackage( child.source.value, child );
							break;

						case 'CallExpression':
							const { callee, arguments: args } = child;
							if (
								callee.name === 'require' &&
								args.length === 1 &&
								args[ 0 ].type === 'Literal' &&
								typeof args[ 0 ].value === 'string'
							) {
								testPackage( args[ 0 ].value, child );
							}
							break;
					}
				} );
			},
		};
	},
};
