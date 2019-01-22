/**
 * External dependencies.
 */
const { get } = require( 'lodash' );

/**
 * Internal dependencies.
 */
const getExportEntries = require( './get-export-entries' );
const getJSDocFromToken = require( './get-jsdoc-from-token' );
const getDependencyPath = require( './get-dependency-path' );

const UNDOCUMENTED = 'Undocumented declaration.';
const NAMESPACE_EXPORT = '*';
const DEFAULT_EXPORT = 'default';

const hasClassWithName = ( node, name ) =>
	node.type === 'ClassDeclaration' &&
	node.id.name === name;

const hasFunctionWithName = ( node, name ) =>
	node.type === 'FunctionDeclaration' &&
	node.id.name === name;

const hasVariableWithName = ( node, name ) =>
	node.type === 'VariableDeclaration' &&
	node.declarations.some( ( declaration ) => declaration.id.name === name );

const hasNamedExportWithName = ( node, name ) =>
	node.type === 'ExportNamedDeclaration' &&
	node.declaration &&
	node.declaration.id.name === name;

const hasImportWithName = ( node, name ) =>
	node.type === 'ImportDeclaration' &&
	node.specifiers.some( ( specifier ) => specifier.local.name === name );

const isImportDeclaration = ( node ) => node.type === 'ImportDeclaration';

const someImportMatchesName = ( name, node ) => node.specifiers.some( ( specifier ) => {
	if ( specifier.type === 'ImportDefaultSpecifier' ) {
		return name === 'default';
	}
	return name === specifier.imported.name;
} );

const getJSDoc = ( token, entry, ast, parseDependency ) => {
	let doc = getJSDocFromToken( token );
	if ( doc === undefined && entry && entry.module === null ) {
		const candidates = ast.body.filter( ( node ) => {
			return hasClassWithName( node, entry.localName ) ||
				hasFunctionWithName( node, entry.localName ) ||
				hasVariableWithName( node, entry.localName ) ||
				hasNamedExportWithName( node, entry.localName ) ||
				hasImportWithName( node, entry.localName );
		} );
		if ( candidates.length === 1 ) {
			const node = candidates[ 0 ];
			if ( isImportDeclaration( node ) ) {
				const ir = parseDependency( getDependencyPath( node ) );
				doc = ir.find( ( { name } ) => someImportMatchesName( name, node ) );
			} else {
				doc = getJSDocFromToken( node );
			}
		}
	} else if ( doc === undefined && entry && entry.module !== null ) {
		const ir = parseDependency( getDependencyPath( token ) );
		if ( entry.localName === NAMESPACE_EXPORT ) {
			doc = ir.filter( ( exportDeclaration ) => exportDeclaration.name !== DEFAULT_EXPORT );
		} else {
			doc = ir.find( ( exportDeclaration ) => exportDeclaration.name === entry.localName );
		}
	}
	return doc;
};

/**
 * Takes a export token and returns an intermediate representation in JSON.
 *
 * If the export token doesn't contain any JSDoc, and it's a identifier,
 * the identifier declaration will be looked up in the file or dependency
 * if an `ast` and `parseDependency` callback are provided.
 *
 * @param {Object} token Espree export token.
 * @param {Object} [ast] Espree ast of a single file.
 * @param {Function} [parseDependency] Function that takes a path
 * and returns the AST of the dependency file.
 *
 * @return {Object} Intermediate Representation in JSON.
 */
module.exports = function( token, ast = { body: [] }, parseDependency = () => {} ) {
	const exportEntries = getExportEntries( token );
	const ir = [];
	exportEntries.forEach( ( entry ) => {
		if ( entry.localName === NAMESPACE_EXPORT ) {
			const doc = getJSDoc( token, entry, ast, parseDependency );
			doc.forEach( ( namedExport ) => {
				ir.push( {
					name: namedExport.name,
					description: namedExport.description,
					tags: namedExport.tags,
				} );
			} );
		} else {
			const doc = getJSDoc( token, entry, ast, parseDependency );
			ir.push( {
				name: entry.exportName,
				description: get( doc, [ 'description' ], UNDOCUMENTED ),
				tags: [],
			} );
		}
	} );
	return ir;
};
