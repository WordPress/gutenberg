/**
 * External dependencies.
 */
const { get, flatten } = require( 'lodash' );
const { SyntaxKind } = require( 'typescript' );

/**
 * Node dependencies.
 */
const { dirname } = require( 'path' );

/**
 * Internal dependencies.
 */
const compile = require( './compile' );
const getExportEntries = require( './get-export-entries' );
const getJSDocFromStatement = require( './get-jsdoc-from-statement' );

/**
 * @typedef {import('typescript').Statement} Statement
 */

/**
 * @typedef {import('typescript').SourceFile} SourceFile
 */

/**
 * @typedef {import('./get-export-entries').ExportEntry} ExportEntry
 */

const UNDOCUMENTED = 'Undocumented declaration.';
const NAMESPACE_EXPORT = '*';
const DEFAULT_EXPORT = 'default';

/**
 * @param {Statement} statement
 * @param {string} name
 */
const hasClassWithName = ( statement, name ) =>
	statement.kind === SyntaxKind.ClassDeclaration &&
	statement.name &&
	statement.name.escapedText === name;

/**
 * @param {Statement} statement
 * @param {string} name
 */
const hasFunctionWithName = ( statement, name ) =>
	statement.kind === SyntaxKind.FunctionDeclaration &&
	statement.name &&
	statement.name.escapedText === name;

/**
 * @param {Statement} statement
 * @param {string} name
 */
const hasVariableWithName = ( statement, name ) =>
	statement.kind === SyntaxKind.VariableStatement &&
	statement.declarationList.declarations.some( ( declaration ) => {
		if ( declaration.name.kind === SyntaxKind.ObjectBindingPattern ) {
			return declaration.name.elements.some(
				( element ) => element.name.escapedText === name
			);
		}
		return declaration.name.escapedText === name;
	} );

/**
 * @param {Statement} statement
 * @param {string} name
 */
const hasImportWithName = ( statement, name ) =>
	statement.kind === SyntaxKind.ImportDeclaration &&
	// import 'x' doesn't have importClause
	statement.importClause &&
	// import a from 'b'
	( ( statement.importClause.name &&
		statement.importClause.name.escapedText === name ) ||
		// import { a } from 'b'
		( statement.importClause.namedBindings &&
			// import * as a from 'b' is SyntaxKind.NamespaceImport
			// So, this check is necessary.
			statement.importClause.namedBindings.kind ===
				SyntaxKind.NamedImports &&
			statement.importClause.namedBindings.elements.some(
				( specifier ) => specifier.name.escapedText === name
			) ) );

const someImportMatchesName = ( name, statement ) => {
	if ( statement.importClause.name && name === 'default' ) {
		return true;
	}

	return statement.importClause.namedBindings.elements.some( ( specifier ) =>
		specifier.propertyName
			? specifier.propertyName.escapedText === name
			: specifier.name.escapedText === name
	);
};

/**
 * @param {string} name
 * @param {ExportEntry} entry
 * @param {Statement} statement
 */
const someEntryMatchesName = ( name, entry, statement ) =>
	( statement.kind === SyntaxKind.ExportDeclaration &&
		entry.localName === name ) ||
	( statement.kind === SyntaxKind.ImportDeclaration &&
		someImportMatchesName( name, statement ) );

/**
 * @typedef IREntry
 *
 * @param {?string} path
 * @param {string} name
 * @param {string} description
 * @param {Array} tags
 */

/**
 * @param {Statement} statement
 * @param {ExportEntry} entry
 * @param {() => Array<IREntry>} getDependencyIR
 */
const getJSDocFromDependency = ( statement, entry, getDependencyIR ) => {
	let doc;
	const ir = getDependencyIR( statement );
	if ( entry.localName === NAMESPACE_EXPORT ) {
		doc = ir.filter( ( { name } ) => name !== DEFAULT_EXPORT );
	} else {
		doc = ir.find( ( { name } ) =>
			someEntryMatchesName( name, entry, statement )
		);
	}
	return doc;
};

/**
 * @param {Statement} statement
 * @param {ExportEntry} entry
 * @param {SourceFile} sourceFile
 * @param {() => Array<IREntry>} getDependencyIR
 */
const getJSDoc = ( statement, entry, sourceFile, getDependencyIR ) => {
	let doc;
	if ( entry.localName !== NAMESPACE_EXPORT ) {
		doc = getJSDocFromStatement( statement );
		if ( doc !== null ) {
			return doc;
		}
	}

	if ( entry && entry.module === null ) {
		const candidates = sourceFile.statements.filter( ( stmt ) => {
			return (
				hasClassWithName( stmt, entry.localName ) ||
				hasFunctionWithName( stmt, entry.localName ) ||
				hasVariableWithName( stmt, entry.localName ) ||
				hasImportWithName( stmt, entry.localName )
			);
		} );
		if ( candidates.length !== 1 ) {
			return doc;
		}
		const node = candidates[ 0 ];
		if ( node.kind === SyntaxKind.ImportDeclaration ) {
			doc = getJSDocFromDependency( node, entry, getDependencyIR );
		} else {
			doc = getJSDocFromStatement( node );
		}
		return doc;
	}

	return getJSDocFromDependency( statement, entry, getDependencyIR );
};

/**
 * Function that takes a path and returns the intermediate representation of the dependency file.
 *
 * @param {SourceFile} sourceFile
 * */
const getDependencyIR = ( sourceFile ) => ( statement ) => {
	const dependencyPath = require.resolve( statement.moduleSpecifier.text, {
		paths: [ dirname( sourceFile.fileName ) ],
	} );

	const { exportStatements, sourceFile: depSourceFile } = compile(
		dependencyPath
	);

	return getIntermediateRepresentation(
		dependencyPath,
		exportStatements,
		depSourceFile
	);
};

/**
 * @param {string} path
 * @param {Statement} statement
 * @param {SourceFile} sourceFile
 *
 * @return {Array<IREntry>} Intermediate Representation in JSON.
 */
const getIRFromStatement = ( path, statement, sourceFile ) => {
	const exportEntries = getExportEntries( statement );
	const ir = [];
	exportEntries.forEach( ( entry ) => {
		const doc = getJSDoc(
			statement,
			entry,
			sourceFile,
			getDependencyIR( sourceFile )
		);
		if ( entry.localName === NAMESPACE_EXPORT ) {
			doc.forEach( ( namedExport ) => {
				ir.push( {
					path,
					name: namedExport.name,
					description: namedExport.description,
					tags: namedExport.tags,
				} );
			} );
		} else {
			let description = get( doc, [ 'description' ], null );
			const tags = get( doc, [ 'tags' ], [] );

			// When a doc has no description but has tags, it's documented.
			if ( description === null ) {
				description = tags.length > 0 ? '' : UNDOCUMENTED;
			}

			ir.push( {
				path,
				name: entry.exportName,
				description,
				tags,
			} );
		}
	} );
	return ir;
};

/**
 * Takes export statements and returns an intermediate representation in JSON.
 *
 * If the export statement doesn't contain any JSDoc and it's an identifier,
 * the identifier declaration will be looked up in the file or dependency.
 *
 * @param {string} path Path to file being processed.
 * @param {Array<Statement>} exportStatements TypeScript export statements.
 * @param {SourceFile} sourceFile TypeScript SourceFile object of the file being parsed.
 *
 * @return {Array<IREntry>} Intermediate Representation in JSON.
 */
const getIntermediateRepresentation = (
	path,
	exportStatements,
	sourceFile
) => {
	return flatten(
		exportStatements.map( ( statement ) =>
			getIRFromStatement( path, statement, sourceFile )
		)
	);
};

module.exports = getIntermediateRepresentation;
