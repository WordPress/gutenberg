#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT_DIR = realpathSync(
	path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../..' )
);
const BASELINE_PATH = path.join(
	ROOT_DIR,
	'tools/eslint/jsx-in-js-baseline.json'
);

const updateBaseline = process.argv.includes( '--update-baseline' );
const acceptNew = process.argv.includes( '--accept-new' );

function getJavaScriptFiles() {
	return execFileSync(
		'git',
		[
			'ls-files',
			'-z',
			'--cached',
			'--',
			'*.js',
		],
		{
			cwd: ROOT_DIR,
			encoding: 'utf8',
		}
	)
		.split( '\0' )
		.filter( Boolean )
		.filter( ( file ) => existsSync( path.join( ROOT_DIR, file ) ) )
		.sort();
}

function isJsxNode( node ) {
	return (
		node.kind === ts.SyntaxKind.JsxElement ||
		node.kind === ts.SyntaxKind.JsxSelfClosingElement ||
		node.kind === ts.SyntaxKind.JsxFragment
	);
}

function containsJsx( sourceFile ) {
	let found = false;

	function visit( node ) {
		if ( found ) {
			return;
		}
		if ( isJsxNode( node ) ) {
			found = true;
			return;
		}
		ts.forEachChild( node, visit );
	}

	visit( sourceFile );
	return found;
}

function formatDiagnostic( file, sourceFile, diagnostic ) {
	const message = ts.flattenDiagnosticMessageText(
		diagnostic.messageText,
		'\n'
	);
	if ( diagnostic.start === undefined ) {
		return `${ file }: ${ message }`;
	}

	const { line, character } = sourceFile.getLineAndCharacterOfPosition(
		diagnostic.start
	);
	return `${ file }:${ line + 1 }:${ character + 1 }: ${ message }`;
}

function findJsxInJavaScriptFiles() {
	const jsxFiles = [];
	const parseErrors = [];

	for ( const file of getJavaScriptFiles() ) {
		const sourceText = readFileSync( path.join( ROOT_DIR, file ), 'utf8' );
		const sourceFile = ts.createSourceFile(
			file,
			sourceText,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.JSX
		);

		for ( const diagnostic of sourceFile.parseDiagnostics ?? [] ) {
			parseErrors.push(
				formatDiagnostic( file, sourceFile, diagnostic )
			);
		}
		if ( containsJsx( sourceFile ) ) {
			jsxFiles.push( file );
		}
	}

	if ( parseErrors.length ) {
		throw new Error(
			[
				'Could not parse the tracked JavaScript inventory:',
				...parseErrors.map( ( error ) => `- ${ error }` ),
			].join( '\n' )
		);
	}

	return jsxFiles;
}

function getFilesHash( files ) {
	return createHash( 'sha256' )
		.update( `${ files.join( '\n' ) }\n` )
		.digest( 'hex' );
}

function readBaseline() {
	if ( ! existsSync( BASELINE_PATH ) ) {
		return null;
	}

	return JSON.parse( readFileSync( BASELINE_PATH, 'utf8' ) );
}

function getDifference( left, right ) {
	const rightSet = new Set( right );
	return left.filter( ( file ) => ! rightSet.has( file ) );
}

function formatFiles( heading, files ) {
	if ( ! files.length ) {
		return [];
	}
	return [ heading, ...files.map( ( file ) => `- ${ file }` ) ];
}

const jsxFiles = findJsxInJavaScriptFiles();
const baseline = readBaseline();
const baselineFiles = baseline?.files ?? [];
const addedFiles = getDifference( jsxFiles, baselineFiles );
const removedFiles = getDifference( baselineFiles, jsxFiles );

if ( updateBaseline ) {
	if ( baseline && addedFiles.length && ! acceptNew ) {
		throw new Error(
			[
				'Refusing to add new JSX-in-.js files to the baseline.',
				'Rename them to .jsx, or use --accept-new only for an explicitly reviewed exception.',
				...formatFiles( 'New files:', addedFiles ),
			].join( '\n' )
		);
	}

	const nextBaseline = {
		description:
			'Tracked JavaScript files that still contain JSX during the .js to .jsx migration.',
		count: jsxFiles.length,
		sha256: getFilesHash( jsxFiles ),
		files: jsxFiles,
	};
	writeFileSync(
		BASELINE_PATH,
		`${ JSON.stringify( nextBaseline, null, '\t' ) }\n`
	);
	console.log(
		`Recorded ${
			jsxFiles.length
		} tracked JSX-in-.js files in ${ path.relative(
			ROOT_DIR,
			BASELINE_PATH
		) }.`
	);
	process.exit( 0 );
}

if ( ! baseline ) {
	throw new Error(
		`Missing ${ path.relative(
			ROOT_DIR,
			BASELINE_PATH
		) }. Run the baseline update command.`
	);
}

const baselineErrors = [];
const normalizedBaselineFiles = [ ...new Set( baselineFiles ) ].sort();
if (
	JSON.stringify( baselineFiles ) !==
	JSON.stringify( normalizedBaselineFiles )
) {
	baselineErrors.push( 'Baseline file entries must be unique and sorted.' );
}
if ( baseline.count !== baselineFiles.length ) {
	baselineErrors.push(
		`Baseline count ${ baseline.count } does not match its ${ baselineFiles.length } file entries.`
	);
}
if ( baseline.sha256 !== getFilesHash( baselineFiles ) ) {
	baselineErrors.push( 'Baseline SHA-256 does not match its file entries.' );
}

if ( baselineErrors.length || addedFiles.length || removedFiles.length ) {
	throw new Error(
		[
			'JSX-in-.js inventory does not match its migration baseline.',
			...baselineErrors,
			...formatFiles(
				'New JSX-in-.js files (rename these to .jsx):',
				addedFiles
			),
			...formatFiles(
				'Baseline entries that no longer contain JSX (update the baseline):',
				removedFiles
			),
		].join( '\n' )
	);
}

console.log(
	`Validated ${ jsxFiles.length } tracked JSX-in-.js migration baseline files.`
);
