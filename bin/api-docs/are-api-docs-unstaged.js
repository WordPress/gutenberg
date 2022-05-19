#!/usr/bin/env node

/**
 * External dependencies
 */
const { extname } = require( 'path' );
const chalk = require( 'chalk' );
const execSync = require( 'child_process' ).execSync;
const { readFile } = require( 'fs' ).promises;

const getUnstagedFiles = () =>
	execSync( 'git diff --name-only', { encoding: 'utf8' } )
		.split( '\n' )
		.filter( Boolean );

const fileHasToken = async ( file ) =>
	( await readFile( file, 'utf8' ) ).includes( '<!-- START TOKEN' );

const getUnstagedReadmes = () =>
	Promise.all(
		getUnstagedFiles().map(
			async ( file ) =>
				extname( file ) === '.md' &&
				( await fileHasToken( file ) ) &&
				file
		)
	).then( ( files ) => files.filter( Boolean ) );

( async () => {
	const unstagedReadmes = await getUnstagedReadmes();
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
} )();
