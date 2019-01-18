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

const getIRFromDependency = ( getCodeFromPath ) => ( path ) => {
	const { ir } = engine( getCodeFromPath( path ) );
	return ir;
};

const engine = ( code, getCodeFromPath = () => {} ) => {
	const result = {};
	result.ast = getAST( code );
	result.tokens = getExportTokens( result.ast );
	result.ir = result.tokens.map(
		( token ) => getIntermediateRepresentation(
			token,
			result.ast,
			getIRFromDependency( getCodeFromPath )
		)
	);

	return result;
};

/**
 * Function that takes code and returns an intermediate representation.
 *
 * @param {string} code The code to parse.
 * @param {Function} [getCodeFromPath=noop] Callback to retrieve code
 * from a relative path.
 *
 * @return {Object} Intermediate Representation in JSON.
 */
module.exports = engine;
