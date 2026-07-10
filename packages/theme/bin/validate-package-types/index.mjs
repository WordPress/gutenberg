import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// eslint-disable-next-line import/no-extraneous-dependencies -- The repo root provides TypeScript for validation scripts.
import ts from 'typescript';

const packageRoot = fileURLToPath( new URL( '../..', import.meta.url ) );
const rootEntryPath = join( packageRoot, 'src/index.ts' );
const packageTypesPath = join( packageRoot, 'src/package-types.ts' );

/**
 * @param {string} moduleSpecifier Relative module specifier.
 * @return {string} Module specifier without a JavaScript extension.
 */
function normalizeModuleSpecifier( moduleSpecifier ) {
	return moduleSpecifier.replace( /\.[cm]?js$/, '' );
}

/**
 * @param {string} filePath Source file path.
 * @return {{ names: Set<string>, stars: Set<string> }} Exported names and
 * star export sources.
 */
function getExportSurface( filePath ) {
	const source = ts.createSourceFile(
		filePath,
		readFileSync( filePath, 'utf8' ),
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS
	);
	/** @type {Set< string >} */
	const names = new Set();
	/** @type {Set< string >} */
	const stars = new Set();

	for ( const node of source.statements ) {
		if ( ts.isExportDeclaration( node ) ) {
			const moduleSpecifier =
				node.moduleSpecifier &&
				ts.isStringLiteral( node.moduleSpecifier )
					? node.moduleSpecifier.text
					: undefined;

			if ( ! node.exportClause ) {
				if ( moduleSpecifier ) {
					stars.add( normalizeModuleSpecifier( moduleSpecifier ) );
				}
				continue;
			}

			if ( ts.isNamedExports( node.exportClause ) ) {
				for ( const element of node.exportClause.elements ) {
					names.add( element.name.text );
				}
			}
			continue;
		}

		const modifiers = ts.canHaveModifiers( node )
			? ts.getModifiers( node )
			: undefined;
		const isExported = modifiers?.some(
			( modifier ) => modifier.kind === ts.SyntaxKind.ExportKeyword
		);

		if ( ! isExported ) {
			continue;
		}

		if ( ts.isVariableStatement( node ) ) {
			for ( const declaration of node.declarationList.declarations ) {
				if ( ts.isIdentifier( declaration.name ) ) {
					names.add( declaration.name.text );
				}
			}
			continue;
		}

		if (
			( ts.isFunctionDeclaration( node ) ||
				ts.isClassDeclaration( node ) ||
				ts.isInterfaceDeclaration( node ) ||
				ts.isTypeAliasDeclaration( node ) ||
				ts.isEnumDeclaration( node ) ) &&
			node.name
		) {
			names.add( node.name.text );
		}
	}

	return { names, stars };
}

/**
 * @param {Set< string >} expected Expected values.
 * @param {Set< string >} actual   Actual values.
 * @return {string[]} Missing values.
 */
function getMissing( expected, actual ) {
	return [ ...expected ].filter( ( value ) => ! actual.has( value ) );
}

const rootEntryExports = getExportSurface( rootEntryPath );
const packageTypeExports = getExportSurface( packageTypesPath );

const missingNames = getMissing(
	rootEntryExports.names,
	packageTypeExports.names
);
const extraNames = getMissing(
	packageTypeExports.names,
	rootEntryExports.names
);
const missingStars = getMissing(
	rootEntryExports.stars,
	packageTypeExports.stars
);
const extraStars = getMissing(
	packageTypeExports.stars,
	rootEntryExports.stars
);

if (
	missingNames.length ||
	extraNames.length ||
	missingStars.length ||
	extraStars.length
) {
	const errors = [
		missingNames.length
			? [
					'Package type facade is missing root exports:',
					...missingNames.map( ( name ) => `- ${ name }` ),
			  ].join( '\n' )
			: '',
		extraNames.length
			? [
					'Package type facade includes exports not present in the root entry:',
					...extraNames.map( ( name ) => `- ${ name }` ),
			  ].join( '\n' )
			: '',
		missingStars.length
			? [
					'Package type facade is missing root star exports:',
					...missingStars.map( ( source ) => `- ${ source }` ),
			  ].join( '\n' )
			: '',
		extraStars.length
			? [
					'Package type facade includes star exports not present in the root entry:',
					...extraStars.map( ( source ) => `- ${ source }` ),
			  ].join( '\n' )
			: '',
	].filter( Boolean );

	console.error( errors.join( '\n\n' ) );
	process.exit( 1 );
}

console.log( 'Validated package type facade exports.' );
