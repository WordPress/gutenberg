#!/usr/bin/env node

/**
 * External dependencies
 */
const { extname, join, resolve } = require( 'path' );
const { readFile } = require( 'fs' ).promises;
const execSync = require( 'child_process' ).execSync;
const chalk = require( 'chalk' );

const ROOT_DIR = resolve( __dirname, '../..' );

const getUnstagedFiles = () =>
	execSync( 'git diff --name-only', { encoding: 'utf8', cwd: ROOT_DIR } )
		.split( '\n' )
		.filter( Boolean );

const fileHasToken = async ( file ) =>
	( await readFile( join( ROOT_DIR, file ), 'utf8' ) ).includes(
		'<!-- START TOKEN'
	);

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
				'Either build and stage them with npm run docs:build or continue with --no-verify.',
				'\n'
			)
		);
	}
} )();
