/**
 * External dependencies.
 */
const { first } = require( 'lodash' );

/**
 * Internal dependencies.
 */
const getNameDeclaration = require( './get-name-declaration' );
const getJSDoc = require( './get-jsdoc' );
const isIdentifierInSameFile = require( './is-identifier-in-same-file' );
const isIdentifierInDependency = require( './is-identifier-in-dependency' );
const getDependencyPath = require( './get-dependency-path' );

/**
 * Takes a export token and the file AST
 * and returns an intermediate representation in JSON.
 *
 * @param {Object} token Espree export token.
 * @param {Object} ast Espree ast of a single file.
 * @param {Function} parseDependency Function that takes a path
 * and returns the AST of the dependency file.
 *
 * @return {Object} Intermediate Representation in JSON.
 */
module.exports = function( token, ast, parseDependency = () => {} ) {
	let ir = getJSDoc( token );
	const name = getNameDeclaration( token );
	// If at this point, the ir is undefined, we'll lookup JSDoc comments either:
	// 1) in the same file declaration
	// 2) in the dependency file declaration
	if ( ir === undefined && isIdentifierInSameFile( token ) ) {
		const candidates = ast.body.filter( ( node ) => {
			return ( node.type === 'FunctionDeclaration' && node.id.name === name ) ||
			( node.type === 'VariableDeclaration' && first( node.declarations ).id.name === name );
		} );
		if ( candidates.length === 1 ) {
			ir = getJSDoc( candidates[ 0 ] );
		}
	} else if ( ir === undefined && isIdentifierInDependency( token ) ) {
		const irFromDependency = parseDependency( getDependencyPath( token ) );
		ir = irFromDependency.find( ( exportDeclaration ) => exportDeclaration.name === name );
	}

	// Sometimes, humans do not add JSDoc, though.
	if ( ir === undefined ) {
		ir = { description: 'Undocumented declaration.', tags: [] };
	}

	ir.name = name;
	return ir;
};
