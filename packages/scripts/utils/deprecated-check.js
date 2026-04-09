/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const chalk = require( 'chalk' );

const WARNING_TEXT = chalk.reset.inverse.bold.yellow( ' WARNING ' );

/**
 * Recursively retrieves all JavaScript and TypeScript files from a directory.
 *
 * @param {string} dir      The directory to search.
 * @param {Array}  fileList The accumulator array for file paths.
 *
 * @return {Array} Array of file paths with JS/TS extensions.
 */
function getAllJsFiles( dir, fileList = [] ) {
	const files = fs.readdirSync( dir );

	files.forEach( ( file ) => {
		const filePath = path.join( dir, file );
		const stat = fs.statSync( filePath );

		if ( stat.isDirectory() ) {
			getAllJsFiles( filePath, fileList );
		} else if ( file.match( /\.(js|jsx|ts|tsx)$/ ) ) {
			fileList.push( filePath );
		}
	} );

	return fileList;
}

/**
 * Checks if a file imports and uses the deprecated() function.
 *
 * @param {string} filePath The path to the file to check.
 *
 * @return {boolean} True if the file uses deprecated(), false otherwise.
 */
function fileUsesDeprecated( filePath ) {
	if ( ! fs.existsSync( filePath ) ) {
		return false;
	}

	const content = fs.readFileSync( filePath, 'utf8' );
	const importRegex =
		/import\s+[^;]*deprecated[^;]*from\s+['"]@wordpress\/deprecated['"]/;
	const requireRegex = /require\(['"]@wordpress\/deprecated['"]\)/;
	const usesDeprecated = /deprecated\s*\(/;

	return (
		( importRegex.test( content ) || requireRegex.test( content ) ) &&
		usesDeprecated.test( content )
	);
}

/**
 * Extracts deprecation messages from a component file's source code.
 *
 * @param {string} filePath The path to the component file.
 *
 * @return {Array} Array of deprecation message objects with feature, options, and message.
 */
function extractDeprecationMessages( filePath ) {
	if ( ! fs.existsSync( filePath ) ) {
		return [];
	}

	const content = fs.readFileSync( filePath, 'utf8' );

	// Check if file imports deprecated function
	const importRegex =
		/import\s+[^;]*deprecated[^;]*from\s+['"]@wordpress\/deprecated['"]/;
	const requireRegex = /require\(['"]@wordpress\/deprecated['"]\)/;

	if ( ! importRegex.test( content ) && ! requireRegex.test( content ) ) {
		return [];
	}

	const messages = [];
	const deprecatedCallPattern =
		/deprecated\s*\(\s*['"]([^'"]+)['"]\s*,\s*\{([^}]*)\}/g;
	let match;

	while ( ( match = deprecatedCallPattern.exec( content ) ) !== null ) {
		const feature = match[ 1 ];
		const optionsStr = match[ 2 ];
		const options = parseDeprecatedOptions( optionsStr );
		const message = reconstructDeprecationMessage( feature, options );

		messages.push( { feature, options, message } );
	}

	return messages;
}

/**
 * Parses the options string from a deprecated() function call.
 *
 * @param {string} optionsStr The options object string from the deprecated call.
 *
 * @return {Object} Parsed options object.
 */
function parseDeprecatedOptions( optionsStr ) {
	const options = {};

	// Extract various option properties using regex patterns
	const optionPatterns = {
		since: /since\s*:\s*['"]([^'"]+)['"]/,
		version: /version\s*:\s*['"]([^'"]+)['"]/,
		alternative: /alternative\s*:\s*['"]([^'"]+)['"]/,
		plugin: /plugin\s*:\s*['"]([^'"]+)['"]/,
		link: /link\s*:\s*['"]([^'"]+)['"]/,
		hint: /hint\s*:\s*['"]([^'"]+)['"]/,
	};

	Object.entries( optionPatterns ).forEach( ( [ key, pattern ] ) => {
		const match = optionsStr.match( pattern );
		if ( match ) {
			options[ key ] = match[ 1 ];
		}
	} );

	return options;
}

/**
 * Reconstructs the deprecation message using the same logic as WordPress's deprecated() function.
 *
 * @param {string} feature The deprecated feature name.
 * @param {Object} options The deprecation options.
 *
 * @return {string} The complete deprecation message.
 */
function reconstructDeprecationMessage( feature, options = {} ) {
	const { since, version, alternative, plugin, link, hint } = options;

	const pluginMessage = plugin ? ` from ${ plugin }` : '';
	const sinceMessage = since ? ` since version ${ since }` : '';
	const versionMessage = version
		? ` and will be removed${ pluginMessage } in version ${ version }`
		: '';
	const useInsteadMessage = alternative
		? ` Please use ${ alternative } instead.`
		: '';
	const linkMessage = link ? ` See: ${ link }` : '';
	const hintMessage = hint ? ` Note: ${ hint }` : '';

	return `${ feature } is deprecated${ sinceMessage }${ versionMessage }.${ useInsteadMessage }${ linkMessage }${ hintMessage }`;
}

/**
 * Checks bundled components.js file for deprecated usage in specific components.
 *
 * @param {string} componentsFilePath The path to the bundled components.js file.
 * @param {Array}  componentNames     Array of component names to check.
 *
 * @return {Array} Array of deprecated component information objects.
 */
function checkBundledComponentsForDeprecated(
	componentsFilePath,
	componentNames
) {
	if ( ! fs.existsSync( componentsFilePath ) ) {
		return [];
	}

	const content = fs.readFileSync( componentsFilePath, 'utf8' );
	const deprecatedComponents = [];

	// In bundled files, deprecated() becomes external_wp_deprecated_default()()
	const usesDeprecated = /external_wp_deprecated_default\(\)\(/;
	if ( ! usesDeprecated.test( content ) ) {
		return deprecatedComponents;
	}

	// Extract all deprecated calls from the bundled file
	const deprecatedCallPattern =
		/external_wp_deprecated_default\(\)\(\s*["']([^"']+)["']\s*,\s*\{([^}]*)\}/g;
	let match;
	const deprecatedCalls = [];

	while ( ( match = deprecatedCallPattern.exec( content ) ) !== null ) {
		const feature = match[ 1 ];
		const optionsStr = match[ 2 ];
		const options = parseDeprecatedOptions( optionsStr );

		deprecatedCalls.push( { feature, options } );
	}

	// Match component names with deprecated calls using precise matching
	componentNames.forEach( ( componentName ) => {
		deprecatedCalls.forEach( ( call ) => {
			if (
				isComponentMatchingDeprecatedCall( componentName, call.feature )
			) {
				const message = reconstructDeprecationMessage(
					call.feature,
					call.options
				);
				deprecatedComponents.push( {
					componentName,
					message,
					feature: call.feature,
					options: call.options,
				} );
			}
		} );
	} );

	return deprecatedComponents;
}

/**
 * Determines if a component name matches a deprecated feature call.
 * Uses precise matching to avoid false positives (e.g., Guide vs GuidePage).
 *
 * @param {string} componentName The component name to check.
 * @param {string} feature       The deprecated feature string.
 *
 * @return {boolean} True if the component matches the deprecated feature.
 */
function isComponentMatchingDeprecatedCall( componentName, feature ) {
	const componentLower = componentName.toLowerCase();

	// Check for exact component name matches in the feature description
	// Look for the component name surrounded by word boundaries or specific characters
	const exactMatch = new RegExp(
		`\\b${ componentLower }\\b|<${ componentLower }>|<${ componentLower }\\s`,
		'i'
	);

	return exactMatch.test( feature );
}

/**
 * Finds all @wordpress/components imports in a JavaScript/TypeScript file.
 *
 * @param {string} filePath The path to the file to analyze.
 *
 * @return {Array} Array of imported component names.
 */
function getComponentImports( filePath ) {
	if ( ! fs.existsSync( filePath ) ) {
		return [];
	}

	const content = fs.readFileSync( filePath, 'utf8' );
	const importRegex =
		/import\s+\{([^}]+)\}\s+from\s+['"]@wordpress\/components['"]/g;
	let match;
	const components = [];

	while ( ( match = importRegex.exec( content ) ) !== null ) {
		const names = match[ 1 ]
			.split( ',' )
			.map( ( name ) => name.trim() )
			.filter( Boolean )
			.map( ( name ) => {
				// Handle aliased imports like "Button as CustomButton"
				const parts = name.split( ' as ' );
				return parts[ 0 ].trim();
			} );
		components.push( ...names );
	}

	return components;
}

/**
 * Finds where a specific component is used in the project files.
 *
 * @param {string} componentName The name of the component to find.
 * @param {string} projectRoot   The root directory of the project.
 *
 * @return {Array} Array of usage information objects with filePath, lineNumber, and columnNumber.
 */
function findComponentUsageInProject( componentName, projectRoot ) {
	const srcDir = path.join( projectRoot, 'src' );
	if ( ! fs.existsSync( srcDir ) ) {
		return [];
	}

	const files = getAllJsFiles( srcDir );
	const usageLocations = [];

	files.forEach( ( filePath ) => {
		const content = fs.readFileSync( filePath, 'utf8' );
		const lines = content.split( '\n' );

		// First check if this file imports the component
		const importRegex = new RegExp(
			`import\\s+\\{[^}]*\\b${ componentName }\\b[^}]*\\}\\s+from\\s+['"]@wordpress\\/components['"]`
		);
		const hasImport = importRegex.test( content );

		if ( hasImport ) {
			// Find the import line
			lines.forEach( ( line, lineIndex ) => {
				if ( importRegex.test( line ) ) {
					// Find the column position of the component name in the import
					const componentMatch = line.match(
						new RegExp( `\\b${ componentName }\\b` )
					);
					if ( componentMatch ) {
						const columnNumber = componentMatch.index + 1; // 1-based indexing
						const relativePath = path.relative(
							projectRoot,
							filePath
						);

						usageLocations.push( {
							filePath: relativePath,
							lineNumber: lineIndex + 1, // 1-based indexing
							columnNumber,
						} );
					}
				}
			} );
		}
	} );

	return usageLocations;
}

/**
 * Collects all @wordpress/components imports from project source files.
 *
 * @param {string} projectRoot The root directory of the project.
 *
 * @return {Set} Set of all imported component names.
 */
function collectProjectComponentImports( projectRoot ) {
	const srcDir = path.join( projectRoot, 'src' );
	if ( ! fs.existsSync( srcDir ) ) {
		return new Set();
	}

	const files = getAllJsFiles( srcDir );
	const allImportedComponents = new Set();

	files.forEach( ( file ) => {
		const imports = getComponentImports( file );
		imports.forEach( ( component ) =>
			allImportedComponents.add( component )
		);
	} );

	return allImportedComponents;
}

/**
 * Finds the source file for a specific component in @wordpress/components.
 *
 * @param {string} componentName The name of the component to find.
 * @param {string} componentsDir The @wordpress/components directory path.
 *
 * @return {string|null} The path to the component file, or null if not found.
 */
function findComponentFile( componentName, componentsDir ) {
	// Try various possible file locations for the component
	const tryFiles = [
		`${ componentsDir }/src/${ componentName }/index.js`,
		`${ componentsDir }/src/${ componentName }/index.jsx`,
		`${ componentsDir }/src/${ componentName }.js`,
		`${ componentsDir }/src/${ componentName }.jsx`,
		`${ componentsDir }/src/${ componentName }/index.ts`,
		`${ componentsDir }/src/${ componentName }/index.tsx`,
		`${ componentsDir }/src/${ componentName }.ts`,
		`${ componentsDir }/src/${ componentName }.tsx`,
		`${ componentsDir }/build-module/${ componentName }/index.js`,
		`${ componentsDir }/build-module/${ componentName }.js`,
	];

	for ( const file of tryFiles ) {
		if ( fs.existsSync( file ) ) {
			return file;
		}
	}

	// Search in index files as fallback
	const indexFiles = [
		path.join( componentsDir, 'src/index.js' ),
		path.join( componentsDir, 'src/index.ts' ),
		path.join( componentsDir, 'build-module/index.js' ),
	];

	for ( const indexFile of indexFiles ) {
		if ( fs.existsSync( indexFile ) ) {
			return indexFile;
		}
	}

	return null;
}

/**
 * Finds the WordPress installation root by looking for the wp-includes directory.
 *
 * @param {string} startPath The path to start searching from.
 *
 * @return {string|null} The WordPress root path, or null if not found.
 */
function findWordPressRoot( startPath ) {
	let currentPath = startPath;

	while ( currentPath !== path.dirname( currentPath ) ) {
		const wpIncludesPath = path.join( currentPath, 'wp-includes' );
		if ( fs.existsSync( wpIncludesPath ) ) {
			return currentPath;
		}
		currentPath = path.dirname( currentPath );
	}

	return null;
}

/**
 * Processes deprecated component usage for node_modules approach.
 *
 * @param {Set}    importedComponents The set of imported component names.
 * @param {string} componentsDir      The @wordpress/components directory path.
 * @param {string} projectRoot        The project root directory.
 *
 * @return {boolean} True if any deprecated usage was found.
 */
function processNodeModulesDeprecation(
	importedComponents,
	componentsDir,
	projectRoot
) {
	let found = false;

	importedComponents.forEach( ( componentName ) => {
		const componentFile = findComponentFile( componentName, componentsDir );

		if ( componentFile && fileUsesDeprecated( componentFile ) ) {
			const deprecationMessages =
				extractDeprecationMessages( componentFile );

			if ( deprecationMessages.length > 0 ) {
				deprecationMessages.forEach( ( msgInfo ) => {
					const usageFiles = findComponentUsageInProject(
						componentName,
						projectRoot
					);
					usageFiles.forEach( ( usageInfo ) => {
						process.stdout.write(
							`\n${ WARNING_TEXT } ${ usageInfo.filePath }\n  ${ usageInfo.lineNumber }:${ usageInfo.columnNumber }  warning  Component '${ componentName }' may use deprecated functionality: ${ msgInfo.message }\n`
						);
					} );
				} );
			} else {
				const usageFiles = findComponentUsageInProject(
					componentName,
					projectRoot
				);
				usageFiles.forEach( ( usageInfo ) => {
					process.stdout.write(
						`\n${ WARNING_TEXT } ${ usageInfo.filePath }\n  ${ usageInfo.lineNumber }:${ usageInfo.columnNumber }  warning  Component '${ componentName }' may use deprecated functionality (unable to extract specific message)\n`
					);
				} );
			}
			found = true;
		}
	} );

	return found;
}

/**
 * Processes deprecated component usage for bundled components approach.
 *
 * @param {Set}    importedComponents The set of imported component names.
 * @param {string} projectRoot        The project root directory.
 *
 * @return {boolean} True if any deprecated usage was found.
 */
function processBundledComponentsDeprecation(
	importedComponents,
	projectRoot
) {
	const wpRoot = findWordPressRoot( projectRoot );
	if ( ! wpRoot ) {
		return false;
	}

	const bundledComponentsPath = path.join(
		wpRoot,
		'wp-includes',
		'js',
		'dist',
		'components.js'
	);

	if ( ! fs.existsSync( bundledComponentsPath ) ) {
		return false;
	}

	const deprecatedComponents = checkBundledComponentsForDeprecated(
		bundledComponentsPath,
		Array.from( importedComponents )
	);

	if ( deprecatedComponents.length === 0 ) {
		return false;
	}

	let found = false;

	deprecatedComponents.forEach( ( deprecatedInfo ) => {
		const usageFiles = findComponentUsageInProject(
			deprecatedInfo.componentName,
			projectRoot
		);
		usageFiles.forEach( ( usageInfo ) => {
			process.stdout.write(
				`\n${ WARNING_TEXT } ${ usageInfo.filePath }\n  ${ usageInfo.lineNumber }:${ usageInfo.columnNumber }  warning  Component '${ deprecatedInfo.componentName }' may use deprecated functionality: ${ deprecatedInfo.message }\n`
			);
			found = true;
		} );
	} );

	return found;
}

/**
 * Main function to scan a project for deprecated @wordpress/components usage.
 *
 * This function analyzes a WordPress project to detect if any imported components
 * from @wordpress/components use deprecated functionality. It supports two approaches:
 * 1. Analyzing source files in node_modules/@wordpress/components
 * 2. Analyzing the bundled wp-includes/js/dist/components.js file
 *
 * @param {string} projectRoot The root directory of the project to scan. Defaults to current working directory.
 */
function checkForDeprecatedUsage( projectRoot = process.cwd() ) {
	// Collect all @wordpress/components imports from the project
	const importedComponents = collectProjectComponentImports( projectRoot );

	if ( importedComponents.size === 0 ) {
		return;
	}

	const componentsDir = path.join(
		projectRoot,
		'node_modules',
		'@wordpress',
		'components'
	);

	if ( fs.existsSync( componentsDir ) ) {
		// Primary approach: analyze source files in node_modules
		processNodeModulesDeprecation(
			importedComponents,
			componentsDir,
			projectRoot
		);
	} else {
		// Fallback approach: analyze bundled components file
		processBundledComponentsDeprecation( importedComponents, projectRoot );
	}
}

module.exports = { checkForDeprecatedUsage };
