const babel = require( '@babel/core' );
const getIntermediateRepresentation = require( './get-intermediate-representation' );

const getAST = ( source, filename ) => {
	const isTypeScript = /\.[cm]?tsx?$/.test( filename );
	const supportsJSX = ! isTypeScript || filename.endsWith( '.tsx' );
	const plugins = [];
	if ( isTypeScript ) {
		plugins.push( 'typescript' );
	}
	if ( supportsJSX ) {
		plugins.push( 'jsx' );
	}

	return babel.parse( source, {
		filename,
		babelrc: false,
		configFile: false,
		parserOpts: { plugins },
	} ).program;
};

const getExportTokens = ( ast ) =>
	ast.body.filter( ( node ) =>
		[
			'ExportNamedDeclaration',
			'ExportDefaultDeclaration',
			'ExportAllDeclaration',
		].includes( node.type )
	);

const engine = ( path, code, getIRFromPath = () => {} ) => {
	if ( ! path || ! code ) {
		return { ast: null, tokens: null, ir: [] };
	}

	const ast = getAST( code, path );
	const tokens = getExportTokens( ast );
	const ir = tokens.flatMap( ( token ) =>
		getIntermediateRepresentation( path, token, ast, getIRFromPath )
	);

	return { ast, tokens, ir };
};

/**
 * Function that takes code and returns an intermediate representation.
 *
 * @param {string}   code                 The code to parse.
 * @param {Function} [getIRFromPath=noop] Callback to retrieve the
 *                                        Intermediate Representation from a path relative to the file
 *                                        being parsed.
 *
 * @return {Object} Intermediate Representation in JSON.
 */
module.exports = engine;
