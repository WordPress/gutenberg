#!/usr/bin/env node

/**
 * Node dependencies.
 */
const { join } = require( 'path' );
const chalk = require( 'chalk' );
const execSync = require( 'child_process' ).execSync;

/**
 * Local dependencies.
 */
const getPackages = require( './packages' );

const getUnstagedFiles = () => execSync( 'git diff --name-only', { encoding: 'utf8' } ).split( '\n' ).filter( ( element ) => '' !== element );

const readmeFiles = getPackages().map( ( [ packageName ] ) => join( 'packages', packageName, 'README.md' ) );
const unstagedFiles = getUnstagedFiles();

const unstagedReadmes = [];
unstagedFiles.forEach( ( element ) => {
	if ( readmeFiles.includes( element ) ) {
		unstagedReadmes.push( element );
	}
} );

let exitCode = 0;
if ( unstagedReadmes.length > 0 ) {
	exitCode = 1;
	process.stdout.write( chalk.red(
		'\n',
		'Some API docs may be out of date:',
		unstagedReadmes.toString(),
		'Either staged them or continue with --no-verify.',
		'\n'
	) );
}

process.exit( exitCode );
