/**
* External dependencies.
*/
const espree = require( 'espree' );

/**
* Internal dependencies.
*/
const getIntermediateRepresentation = require( './get-intermediate-representation' );

const getAST = ( source ) => espree.parse( source, {
	attachComment: true,
	ecmaVersion: 2018,
	ecmaFeatures: {
		jsx: true,
	},
	sourceType: 'module',
} );

const getExportTokens = ( ast ) => ast.body.filter(
	( node ) => [
		'ExportNamedDeclaration',
		'ExportDefaultDeclaration',
		'ExportAllDeclaration',
	].some( ( declaration ) => declaration === node.type )
);

const getIRFromDependency = ( getCodeFromPath ) => ( path ) => engine( getCodeFromPath( path ) );

const engine = ( code, getCodeFromPath = () => {} ) => {
	const ast = getAST( code );
	const tokens = getExportTokens( ast );
	return tokens.map(
		( token ) => getIntermediateRepresentation(
			token,
			ast,
			getIRFromDependency( getCodeFromPath )
		)
	);
};

/**
 * Function that takes code and returns an intermediate representation.
 *
 * @param {string} code The code to parse.
 * @param {Function} getCodeFromDependency Callback to retrieve code
 * from a relative path.
 *
 * @return {Object} Intermediate Representation in JSON.
 */
module.exports = engine;
