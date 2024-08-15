/**
 * External dependencies
 */
const fs = require( 'fs' );

/**
 * Internal dependencies
 */
const isBlockMetadataExperimental = require( './src/utils/is-block-metadata-experimental' );

/**
 * Creates a babel plugin that replaces experimental block imports with
 * null variable declarations.
 *
 * For example:
 *     import * as experimentalBlock from "./experimental-block";
 * On build becomes:
 *     const experimentalBlock = null;
 *
 * This ensures the dead code elimination removes the experimental blocks modules
 * during the production build.
 *
 * For more context, see https://github.com/WordPress/gutenberg/pull/40655/
 *
 * @param {Function} shouldProcessImport Optional callback to decide whether a given import should be processed.
 * @param {boolean}  isGutenbergPlugin   Whether to run the plugin.
 */
function createBabelPlugin( shouldProcessImport, isGutenbergPlugin ) {
	if ( ! shouldProcessImport ) {
		shouldProcessImport = isImportDeclarationAnExperimentalBlock;
	}
	if ( isGutenbergPlugin === undefined ) {
		// process.env.npm_package_config_IS_GUTENBERG_PLUGIN is a string, not a boolean
		isGutenbergPlugin =
			String( process.env.npm_package_config_IS_GUTENBERG_PLUGIN ) ===
			'true';
	}
	/**
	 * The babel plugin created by createBabelPlugin.
	 *
	 * @see createBabelPlugin.
	 * @param {import('@babel/core')} babel Current Babel object.
	 * @return {import('@babel/core').PluginObj} Babel plugin object.
	 */
	return function babelPlugin( { types: t } ) {
		if ( isGutenbergPlugin ) {
			return {};
		}

		return {
			visitor: {
				ImportDeclaration( path ) {
					// Only process the experimental blocks.
					if ( ! shouldProcessImport( path ) ) {
						return;
					}

					// Get the imported variable name.
					const namespaceSpecifier = path.node.specifiers.find(
						( specifier ) =>
							specifier.type === 'ImportNamespaceSpecifier'
					);
					const { name } = namespaceSpecifier.local;

					path.replaceWith(
						t.variableDeclaration( 'const', [
							t.variableDeclarator(
								t.identifier( name ),
								t.nullLiteral()
							),
						] )
					);
				},
			},
		};
	};
}

/**
 * Tests whether an import declaration refers to an experimental block.
 * In broad strokes, it's a block that says "__experimental" in its block.json file.
 * For details, check the implementation.
 *
 * @param {Object} path Babel.js AST path representing the import declaration,
 * @return {boolean | undefined} Whether the import represents an experimental block.
 */
function isImportDeclarationAnExperimentalBlock( path ) {
	// Only look for wildcard imports like import * as a from "source":
	const { node } = path;
	const namespaceSpecifier = node.specifiers.find(
		( specifier ) => specifier.type === 'ImportNamespaceSpecifier'
	);
	if ( ! namespaceSpecifier || ! namespaceSpecifier.local ) {
		return;
	}

	// Only look for imports starting with ./ and without additional slashes in the path.
	const importedPath = node.source.value;
	if (
		! importedPath ||
		! importedPath.startsWith( './' ) ||
		importedPath.split( '/' ).length > 2
	) {
		return false;
	}

	// Check the imported directory has a related block.json file.
	const blockJsonPath = __dirname + '/src/' + importedPath + '/block.json';
	if ( ! fs.existsSync( blockJsonPath ) ) {
		return false;
	}

	// Read the block.json file related to this block
	const { name } = namespaceSpecifier.local;
	let blockJSONBuffer;
	try {
		blockJSONBuffer = fs.readFileSync( blockJsonPath );
	} catch ( e ) {
		process.stderr.write(
			'Could not read block.json for the module "' +
				importedPath +
				'" imported under name "' +
				name +
				'" from path "' +
				blockJsonPath +
				'"'
		);
		throw e;
	}
	let blockJSON;
	try {
		blockJSON = JSON.parse( blockJSONBuffer );
	} catch ( e ) {
		process.stderr.write(
			'Could not parse block.json for the module "' +
				importedPath +
				'" imported under name "' +
				name +
				'" read from path "' +
				blockJsonPath +
				'"'
		);
		throw e;
	}
	if ( ! isBlockMetadataExperimental( blockJSON ) ) {
		return false;
	}

	return true;
}

const babelPlugin = createBabelPlugin();
babelPlugin.createBabelPlugin = createBabelPlugin;
module.exports = babelPlugin;
