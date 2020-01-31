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

const getUnstagedFiles = () =>
	execSync( 'git diff --name-only', { encoding: 'utf8' } )
		.split( '\n' )
		.filter( ( element ) => '' !== element );
const readmeFiles = getPackages().map( ( [ packageName ] ) =>
	join( 'packages', packageName, 'README.md' )
);
const unstagedReadmes = getUnstagedFiles().filter( ( element ) =>
	readmeFiles.includes( element )
);

if ( unstagedReadmes.length > 0 ) {
	process.exitCode = 1;
	process.stdout.write(
		chalk.red(
			'\n',
			'Some API docs may be out of date:',
			unstagedReadmes.toString(),
			'Either stage them or continue with --no-verify.',
			'\n'
		)
	);
}
