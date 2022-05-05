/**
 * External dependencies
 */
const fs = require( 'fs' );

/**
 * Internal dependencies
 */
const isBlockMetadataExperimental = require( './src/is-block-metadata-experimental' );

const BLOCK_LIBRARY_INDEX_PATH = 'block-library/src/index.js';

/**
 * Creates a babel plugin that wraps the references to experimental
 * blocks imported in BLOCK_LIBRARY_INDEX_PATH in conditional expressions.
 *
 * For example:
 *     myExperimentalBlock,
 * On build becomes:
 *     process.env.IS_GUTENBERG_PLUGIN === true ? myExperimentalBlock : void 0
 *
 * This ensures the dead code elimination removes the experimental blocks modules
 * during the production build.
 *
 * For more context, see https://github.com/WordPress/gutenberg/pull/40655/
 *
 * @param {Function} shouldProcessFile   Optional callback to decide whether a given file should be processed.
 * @param {Function} shouldProcessImport Optional callback to decide whether a given import should be processed.
 */
function createBabelPlugin( shouldProcessFile, shouldProcessImport ) {
	if ( ! shouldProcessFile ) {
		shouldProcessFile = isProcessingBlockLibraryIndexJs;
	}
	if ( ! shouldProcessImport ) {
		shouldProcessImport = isImportDeclarationAnExperimentalBlock;
	}
	/**
	 * The babel plugin created by createBabelPlugin.
	 *
	 * @see createBabelPlugin.
	 * @param {import('@babel/core')} babel Current Babel object.
	 * @return {import('@babel/core').PluginObj} Babel plugin object.
	 */
	return function babelPlugin( { types: t } ) {
		const seen = Symbol();

		const processEnvExpression = t.memberExpression(
			t.identifier( 'process' ),
			t.identifier( 'env' ),
			false
		);

		const nodeEnvCheckExpression = t.binaryExpression(
			'===',
			t.memberExpression(
				processEnvExpression,
				t.identifier( 'IS_GUTENBERG_PLUGIN' ),
				false
			),
			t.booleanLiteral( true )
		);

		return {
			pre() {
				this.importedExperimentalBlocks = new Set();
				this.transformedExperimentalBlocks = new Set();
			},
			visitor: {
				ImportDeclaration( path, state ) {
					if ( ! shouldProcessFile( state.file ) ) {
						return;
					}

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

					// Keep track of all the imported identifiers of the experimental blocks.
					this.importedExperimentalBlocks.add( name );
				},
				Identifier( path, state ) {
					if ( ! shouldProcessFile( state.file ) ) {
						return;
					}

					const { node } = path;

					// Ignore if it's already been processed.
					if ( node[ seen ] ) {
						return;
					}

					// Ignore if not used in an expression (but, say, a statement).
					if ( ! path.isExpression( path.parent ) ) {
						return;
					}

					// Ignore if it's not one of the experimental blocks identified in the ImportDeclaration visitor.
					const names = Array.from( this.importedExperimentalBlocks );
					const isExperimentalBlock =
						names
							.map( ( name ) => path.isIdentifier( { name } ) )
							.filter( ( x ) => x ).length > 0;

					if ( ! isExperimentalBlock ) {
						return;
					}

					// Turns this code:
					//
					//    archives,
					//
					// Into this:
					//
					//    process.env.IS_GUTENBERG_PLUGIN === true ? archives : void 0;
					//
					// So that later, webpack can turn it into this:
					//
					//    true === true ? archives : void 0;
					node[ seen ] = true;
					path.replaceWith(
						t.ifStatement(
							nodeEnvCheckExpression,
							t.blockStatement( [
								t.expressionStatement( node ),
							] )
						)
					);

					// Keep track of all the transformations.
					this.transformedExperimentalBlocks.add( node.name );
				},
			},

			/**
			 * After the build, confirm that all the imported experimental blocks were
			 * indeed transformed by the visitor above.
			 *
			 * @param {Object} fileState Babel-provided state.
			 */
			post( fileState ) {
				if ( ! shouldProcessFile( fileState ) ) {
					return;
				}

				if (
					! areSetsEqual(
						this.importedExperimentalBlocks,
						this.transformedExperimentalBlocks
					)
				) {
					const importedAsString = Array.from(
						this.importedExperimentalBlocks
					).join( ', ' );
					const transformedAsString = Array.from(
						this.transformedExperimentalBlocks
					).join( ', ' );
					throw new Error(
						'Some experimental blocks were not transformed in ' +
							BLOCK_LIBRARY_INDEX_PATH +
							'.\n Imported:    ' + // Additional spaces to keep the outputs aligned in CLI.
							importedAsString +
							',\n Transformed: ' +
							transformedAsString
					);
				}
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
 * @return {boolean} Whether the import represents an experimental block.
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

/**
 * @param {Object} file Babel.js file object.
 * @return {boolean} true if file refers to packages/block-library/index.js.
 */
function isProcessingBlockLibraryIndexJs( file ) {
	return (
		file.opts &&
		file.opts.filename &&
		file.opts.filename.endsWith( BLOCK_LIBRARY_INDEX_PATH )
	);
}

/**
 * @param {Set} set1 The first set.
 * @param {Set} set2 The second set.
 * @return {boolean} Whether the two sets contain the same data.
 */
function areSetsEqual( set1, set2 ) {
	return (
		set1.size === set2.size &&
		Array.from( set1 ).every( ( value ) => set2.has( value ) )
	);
}

const babelPlugin = createBabelPlugin();
babelPlugin.createBabelPlugin = createBabelPlugin;
module.exports = babelPlugin;
