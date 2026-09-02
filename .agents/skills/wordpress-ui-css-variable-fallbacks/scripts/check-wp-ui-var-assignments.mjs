#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSIGNMENT_RE = /--wp-ui-[a-z0-9-]+\s*:/gi;
const STYLE_EXT = /\.(?:css|scss)$/;

function stripCommentsPreservingLines( css ) {
	return css.replace( /\/\*[\s\S]*?\*\//g, ( block ) =>
		block.replace( /[^\n\r]/g, ' ' )
	);
}

export function findAssignments( css, file ) {
	const stripped = stripCommentsPreservingLines( css );
	const findings = [];
	const lines = stripped.split( '\n' );

	for ( let i = 0; i < lines.length; i++ ) {
		const line = lines[ i ];
		ASSIGNMENT_RE.lastIndex = 0;
		if ( ASSIGNMENT_RE.test( line ) ) {
			findings.push( {
				file,
				line: i + 1,
				text: line.trim(),
			} );
		}
	}

	return findings;
}

function collectStyleFiles( target ) {
	const stat = fs.statSync( target );
	if ( stat.isFile() ) {
		return STYLE_EXT.test( target ) ? [ target ] : [];
	}

	const files = [];
	for ( const entry of fs.readdirSync( target, { withFileTypes: true } ) ) {
		if ( entry.name === 'node_modules' || entry.name === 'build' ) {
			continue;
		}
		const full = path.join( target, entry.name );
		if ( entry.isDirectory() ) {
			files.push( ...collectStyleFiles( full ) );
		} else if ( STYLE_EXT.test( entry.name ) ) {
			files.push( full );
		}
	}
	return files;
}

function formatFindings( findings ) {
	return findings
		.map( ( f ) => `${ f.file }:${ f.line }: ${ f.text }` )
		.join( '\n' );
}

function selfTest() {
	const fixtures = path.join(
		path.dirname( fileURLToPath( import.meta.url ) ),
		'fixtures'
	);
	const assigns = findAssignments(
		fs.readFileSync( path.join( fixtures, 'assigns.css' ), 'utf8' ),
		'assigns.css'
	);
	const fallbacks = findAssignments(
		fs.readFileSync( path.join( fixtures, 'fallback.css' ), 'utf8' ),
		'fallback.css'
	);
	const commented = findAssignments(
		fs.readFileSync( path.join( fixtures, 'comment.css' ), 'utf8' ),
		'comment.css'
	);

	const errors = [];
	if ( assigns.length !== 1 ) {
		errors.push(
			`assigns.css: expected 1 assignment, got ${ assigns.length }`
		);
	}
	if ( fallbacks.length !== 0 ) {
		errors.push(
			`fallback.css: expected 0 assignments, got ${ fallbacks.length }`
		);
	}
	if ( commented.length !== 0 ) {
		errors.push(
			`comment.css: expected 0 assignments, got ${ commented.length }`
		);
	}

	if ( errors.length ) {
		console.error( errors.join( '\n' ) );
		process.exit( 1 );
	}

	console.log( 'self-test ok' );
}

function main( argv ) {
	if ( argv.includes( '--self-test' ) ) {
		selfTest();
		return;
	}

	const repoRoot = process.cwd();
	const positional = argv.filter( ( arg ) => ! arg.startsWith( '-' ) );
	const inventory = positional.length === 0;
	const targets = inventory
		? [ path.join( repoRoot, 'packages/ui' ) ]
		: positional.map( ( p ) => path.resolve( repoRoot, p ) );

	const files = targets.flatMap( collectStyleFiles );
	const findings = files.flatMap( ( file ) =>
		findAssignments(
			fs.readFileSync( file, 'utf8' ),
			path.relative( repoRoot, file )
		)
	);

	if ( findings.length ) {
		console.log( formatFindings( findings ) );
		console.error( `\n${ findings.length } --wp-ui-* assignment(s)` );
		if ( ! inventory ) {
			process.exit( 1 );
		}
		return;
	}

	console.log( 'no --wp-ui-* assignments' );
}

const isDirectRun =
	process.argv[ 1 ] &&
	path.resolve( process.argv[ 1 ] ) === fileURLToPath( import.meta.url );

if ( isDirectRun ) {
	main( process.argv.slice( 2 ) );
}
