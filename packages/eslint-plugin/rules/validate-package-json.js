'use strict';

/**
 * External dependencies
 */
const { NpmPackageJsonLint } = require( 'npm-package-json-lint' );

/**
 * WordPress dependencies
 */
const wpConfig = require( '@wordpress/npm-package-json-lint-config' );

/**
 * Find the line and column for a specific property in the source text
 * @param {string} text         - The full source text
 * @param {string} propertyName - The property name to find
 * @return {Object|null} Object with line and column, or null
 */
function findPropertyLocation( text, propertyName ) {
	const lines = text.split( '\n' );
	const pattern = new RegExp(
		`^\\s*"${ propertyName.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) }"\\s*:`
	);

	for ( let i = 0; i < lines.length; i++ ) {
		if ( pattern.test( lines[ i ] ) ) {
			const column = lines[ i ].indexOf( `"${ propertyName }"` );
			return {
				line: i + 1,
				column,
			};
		}
	}

	return null;
}

module.exports = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Validate package.json using npm-package-json-lint',
		},
		fixable: 'code',
		schema: [
			{
				type: 'object',
				properties: {
					rules: {
						type: 'object',
					},
				},
				additionalProperties: false,
			},
		],
	},
	create( context ) {
		const options = ( context.options && context.options[ 0 ] ) || {};
		const filename = context.getFilename();

		// Merge WordPress config with user overrides
		let lintConfig = wpConfig;
		if ( options.rules ) {
			lintConfig = {
				...wpConfig,
				rules: {
					...wpConfig.rules,
					...options.rules,
				},
			};
		}

		if ( ! filename.endsWith( 'package.json' ) ) {
			return {};
		}

		return {
			Program() {
				const sourceCode = context.getSourceCode();
				const packageJsonText = sourceCode.getText();

				try {
					const packageJsonObject = JSON.parse( packageJsonText );

					const linter = new NpmPackageJsonLint( {
						cwd: process.cwd(),
						packageJsonObject,
						packageJsonFilePath: filename,
						config: lintConfig,
					} );

					const results = linter.lint();

					if ( results.results && results.results.length > 0 ) {
						const fileResults = results.results[ 0 ];

						// Define rule mappings
						const ALPHABETICAL_RULES = {
							'prefer-alphabetical-dependencies': 'dependencies',
							'prefer-alphabetical-devDependencies':
								'devDependencies',
							'prefer-alphabetical-peerDependencies':
								'peerDependencies',
							'prefer-alphabetical-bundledDependencies':
								'bundledDependencies',
							'prefer-alphabetical-optionalDependencies':
								'optionalDependencies',
						};

						// Track if we need to apply fixes
						let needsPropertyReorder = false;
						const fieldsToSort = [];

						// Collect all issues and determine what needs fixing
						fileResults.issues.forEach( ( issue ) => {
							if ( issue.lintId === 'prefer-property-order' ) {
								needsPropertyReorder = true;
							}

							if ( ALPHABETICAL_RULES[ issue.lintId ] ) {
								const field =
									ALPHABETICAL_RULES[ issue.lintId ];
								if ( packageJsonObject[ field ] ) {
									fieldsToSort.push( field );
								}
							}
						} );

						let updatedPackageJson = { ...packageJsonObject };
						let hasAnyFixes = false;

						// Property reordering
						if ( needsPropertyReorder ) {
							const propertyOrder =
								lintConfig.rules[
									'prefer-property-order'
								][ 1 ];
							const originalKeys =
								Object.keys( packageJsonObject );

							const sortedKeys = originalKeys
								.slice()
								.sort( ( a, b ) => {
									const indexA = propertyOrder.indexOf( a );
									const indexB = propertyOrder.indexOf( b );
									const orderA =
										indexA === -1 ? Infinity : indexA;
									const orderB =
										indexB === -1 ? Infinity : indexB;

									if ( orderA !== orderB ) {
										return orderA - orderB;
									}

									// For properties not in the list, maintain original order
									return (
										originalKeys.indexOf( a ) -
										originalKeys.indexOf( b )
									);
								} );

							const reordered = {};
							sortedKeys.forEach( ( key ) => {
								reordered[ key ] = updatedPackageJson[ key ];
							} );

							updatedPackageJson = reordered;
							hasAnyFixes = true;
						}

						// Alphabetical sorting to dependency fields
						if ( fieldsToSort.length > 0 ) {
							fieldsToSort.forEach( ( field ) => {
								const sorted = {};
								Object.keys( updatedPackageJson[ field ] )
									.sort()
									.forEach( ( key ) => {
										sorted[ key ] =
											updatedPackageJson[ field ][ key ];
									} );
								updatedPackageJson[ field ] = sorted;
							} );
							hasAnyFixes = true;
						}

						// Helper function to create fix that updates package.json
						const createJsonFix = ( fixer ) => {
							const fixedJson =
								JSON.stringify(
									updatedPackageJson,
									null,
									'\t'
								) + '\n';
							return fixer.replaceText(
								sourceCode.ast,
								fixedJson
							);
						};

						// Report all issues
						let fixAdded = false;
						fileResults.issues.forEach( ( issue ) => {
							// Determine which property to highlight
							let propertyName = null;

							if ( issue.lintId === 'prefer-property-order' ) {
								// Highlight the first property (opening brace area)
								propertyName =
									Object.keys( packageJsonObject )[ 0 ];
							} else if ( ALPHABETICAL_RULES[ issue.lintId ] ) {
								// Highlight the dependency section name
								propertyName =
									ALPHABETICAL_RULES[ issue.lintId ];
							} else if (
								issue.lintId.startsWith( 'require-' )
							) {
								// Handle require-* rules (e.g., require-license -> license)
								propertyName = issue.lintId.replace(
									'require-',
									''
								);
							} else if (
								issue.lintId.startsWith( 'valid-values-' )
							) {
								// Handle valid-values-* rules (e.g., valid-values-license -> license)
								propertyName = issue.lintId.replace(
									'valid-values-',
									''
								);
							} else if ( issue.lintId.endsWith( '-type' ) ) {
								// Handle *-type rules (e.g., license-type -> license)
								propertyName = issue.lintId.replace(
									/-type$/,
									''
								);
							} else if ( issue.lintId.endsWith( '-format' ) ) {
								// Handle *-format rules (e.g., name-format -> name)
								propertyName = issue.lintId.replace(
									/-format$/,
									''
								);
							}

							// Try to find specific location for the property
							let loc = null;
							if ( propertyName ) {
								const propLoc = findPropertyLocation(
									packageJsonText,
									propertyName
								);
								if ( propLoc ) {
									loc = {
										start: {
											line: propLoc.line,
											column: propLoc.column,
										},
										end: {
											line: propLoc.line,
											column:
												propLoc.column +
												propertyName.length +
												2, // +2 for quotes
										},
									};
								}
							}

							const report = {
								loc: loc || {
									start: { line: 1, column: 0 },
									end: { line: 1, column: 1 },
								},
								message: `${ issue.lintId }: ${ issue.lintMessage }`,
								severity: issue.severity === 'error' ? 2 : 1,
							};

							// Only add fix to the first issue if we have fixes to apply
							// This prevents multiple conflicting fixes
							if ( hasAnyFixes && ! fixAdded ) {
								report.fix = createJsonFix;
								fixAdded = true;
							}

							context.report( report );
						} );
					}
				} catch ( error ) {
					// Only catch JSON parsing errors, rethrow others
					if ( error instanceof SyntaxError ) {
						return;
					}

					throw error;
				}
			},
		};
	},
};
