/** @typedef {import('estree').Comment} Comment */
/** @typedef {import('estree').Node} Node */

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
	meta: {
		type: 'layout',
		docs: {
			description: 'Enforce dependencies docblocks formatting',
			url: 'https://github.com/WordPress/gutenberg/blob/HEAD/packages/eslint-plugin/docs/rules/dependency-group.md',
		},
		schema: [],
		fixable: 'code',
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
		 * Object describing a dependency block correction to be made.
		 *
		 * @typedef WPDependencyBlockCorrection
		 *
		 * @property {Comment} [comment] Comment node on which to replace value,
		 *                               if one can be salvaged.
		 * @property {string}  value     Expected comment node value.
		 */

		/**
		 * Given a desired locality, generates the expected comment node value
		 * property.
		 *
		 * @param {WPPackageLocality} locality Desired package locality.
		 *
		 * @return {string} Expected comment node value.
		 */
		function getCommentValue( locality ) {
			return `*\n * ${ locality } dependencies\n `;
		}

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
		 * @param {Comment}           node     Comment node to check.
		 * @param {WPPackageLocality} locality Desired package locality.
		 *
		 * @return {boolean} Whether comment node satisfies locality.
		 */
		function isLocalityDependencyBlock( node, locality ) {
			const { type, value } = node;
			if ( type !== 'Block' ) {
				return false;
			}

			// Tolerances:
			// - Normalize `/**` and `/*`
			// - Case insensitive "Dependencies" vs. "dependencies"
			// - Ending period
			// - "Node" dependencies as an alias for External.

			if ( locality === 'External' ) {
				locality = '(External|Node)';
			}

			const pattern = new RegExp(
				`^\\*?\\n \\* ${ locality } dependencies\\.?\\n $`,
				'i'
			);
			return pattern.test( value );
		}

		/**
		 * Returns true if the given node occurs prior in code to a reference,
		 * or false otherwise.
		 *
		 * @param {Comment} node      Node to test being before reference.
		 * @param {Node}    reference Node against which to compare.
		 *
		 * @return {boolean} Whether node occurs before reference.
		 */
		function isBefore( node, reference ) {
			if ( ! node.range || ! reference.range ) {
				return false;
			}

			return node.range[ 0 ] < reference.range[ 0 ];
		}

		/**
		 * Tests source comments to determine whether a comment exists which
		 * satisfies the desired locality. If a match is found and requires no
		 * updates, the function returns undefined. Otherwise, it will return
		 * a WPDependencyBlockCorrection object describing a correction.
		 *
		 * @param {Node}              node     Node to test.
		 * @param {WPPackageLocality} locality Desired package locality.
		 *
		 * @return {WPDependencyBlockCorrection | undefined} Correction, if applicable.
		 */
		function getDependencyBlockCorrection( node, locality ) {
			const value = getCommentValue( locality );

			let comment;
			for ( let i = 0; i < comments.length; i++ ) {
				comment = comments[ i ];

				if ( ! isBefore( comment, node ) ) {
					// Exhausted options.
					break;
				}

				if ( ! isLocalityDependencyBlock( comment, locality ) ) {
					// Not usable (either not an block comment, or not one
					// matching a tolerable pattern).
					continue;
				}

				if ( comment.value === value ) {
					// No change needed. (OK)
					return;
				}

				// Found a comment needing correction.
				return { comment, value };
			}

			return { value };
		}

		return {
			/**
			 * @param {import('estree').Program} node Program node.
			 */
			Program( node ) {
				/**
				 * The set of package localities which have been reported for
				 * the current program. Each locality is reported at most one
				 * time, since otherwise the fixer would insert a comment
				 * block for each individual import statement.
				 *
				 * @type {Set<WPPackageLocality>}
				 */
				const verified = new Set();

				/**
				 * Nodes to check for violations associated with module import,
				 * an array of tuples of the node and its import source string.
				 *
				 * @type {Array<[Node,string]>}
				 */
				const candidates = [];

				// Since we only care to enforce imports which occur at the
				// top-level scope, match on Program and test its children,
				// rather than matching the import nodes directly.
				node.body.forEach( ( child ) => {
					/** @type {string} */
					let source;
					switch ( child.type ) {
						case 'ImportDeclaration':
							source = /** @type {string} */ (
								child.source.value
							);
							candidates.push( [ child, source ] );
							break;

						case 'VariableDeclaration':
							child.declarations.forEach( ( declaration ) => {
								const { init } = declaration;
								if (
									! init ||
									init.type !== 'CallExpression' ||
									/** @type {import('estree').CallExpression} */ (
										init
									).callee.type !== 'Identifier' ||
									/** @type {import('estree').Identifier} */ (
										init.callee
									).name !== 'require'
								) {
									return;
								}

								const { arguments: args } = init;
								if (
									args.length === 1 &&
									args[ 0 ].type === 'Literal' &&
									typeof args[ 0 ].value === 'string'
								) {
									source = args[ 0 ].value;
									candidates.push( [ child, source ] );
								}
							} );
					}
				} );

				for ( const [ child, source ] of candidates ) {
					const locality = getPackageLocality( source );
					if ( verified.has( locality ) ) {
						continue;
					}

					// Avoid verifying any other imports for the locality,
					// regardless whether a correction must be made.
					verified.add( locality );

					// Determine whether a correction must be made.
					const correction = getDependencyBlockCorrection(
						child,
						locality
					);
					if ( ! correction ) {
						continue;
					}

					context.report( {
						node: child,
						message: `Expected preceding "${ locality } dependencies" comment block`,
						fix( fixer ) {
							const { comment, value } = correction;
							const text = `/*${ value }*/`;
							if ( comment && comment.range ) {
								return fixer.replaceTextRange(
									comment.range,
									text
								);
							}

							return fixer.insertTextBefore( child, text + '\n' );
						},
					} );
				}
			},
		};
	},
};
