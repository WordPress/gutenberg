#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT = path.resolve( __dirname, '../..' );

const ES5_BLOCK = path.join( ROOT, 'example-static-es5' );
const STATIC_BLOCK = path.join( ROOT, 'example-static' );

// `npm` is a `.cmd` shim on Windows that only resolves through the shell.
const NEEDS_SHELL = process.platform === 'win32';

/**
 * Log a status message.
 *
 * @param {string} message
 */
function status( message ) {
	console.log( '\n' + chalk.bold.blue( message ) + '\n' );
}

/**
 * Log an error message and exit.
 *
 * @param {string} message
 */
function fail( message ) {
	console.error( '\n' + chalk.bold.red( message ) + '\n' );
	process.exit( 1 );
}

/**
 * Execute a command and exit on failure.
 *
 * @param {string}   command Command to execute.
 * @param {string[]} args    Command arguments.
 * @param {Object}   options Spawn options.
 */
function run( command, args, options = {} ) {
	const result = spawnSync( command, args, {
		stdio: 'inherit',
		shell: NEEDS_SHELL,
		...options,
	} );
	if ( result.error ) {
		fail( `Failed to spawn ${ command }: ${ result.error.message }` );
	}
	if ( result.status !== 0 ) {
		process.exit( result.status ?? 1 );
	}
}

/**
 * Execute a command via `npm exec` and exit on failure.
 *
 * @param {string}   bin     Binary to execute (must be in `devDependencies`).
 * @param {string[]} args    Command arguments.
 * @param {Object}   options Spawn options.
 */
function npmExec( bin, args, options = {} ) {
	run( 'npm', [ 'exec', '--no', '--', bin, ...args ], options );
}

/**
 * Execute a `wp-scripts` command inside the static block directory.
 *
 * @param {...string} args Command arguments forwarded to `wp-scripts`.
 */
function wpScripts( ...args ) {
	npmExec( 'wp-scripts', args, { cwd: STATIC_BLOCK } );
}

/**
 * Mirrors `find <dir> -maxdepth <n> -type f | wc -l` from the original bash
 * script: counts files reachable from `dir` within `maxDepth` levels.
 *
 * This is used to verify the expected number of files are generated without relying on exact file names, which may change over time. We just want to
 * ensure a reasonable number of files are generated in the expected structure.
 *
 * @param {string} dir      Directory to count files in.
 * @param {number} maxDepth Maximum directory depth to traverse (1 = only count files directly in `dir`).
 *
 * @return {number} Number of files found within `maxDepth` levels of `dir`.
 */
function countFiles( dir, maxDepth ) {
	let count = 0;
	const walk = ( current, depth ) => {
		for ( const entry of fs.readdirSync( current, {
			withFileTypes: true,
		} ) ) {
			if ( entry.isFile() ) {
				count++;
			} else if ( entry.isDirectory() && depth < maxDepth ) {
				walk( path.join( current, entry.name ), depth + 1 );
			}
		}
	};
	walk( dir, 1 );
	return count;
}

/**
 * Assert that the number of files in a directory matches the expected count.
 *
 * @param {string} dir      Directory to count files in.
 * @param {string} label    Label for error messages.
 * @param {number} maxDepth Maximum directory depth to traverse (1 = only count files directly in `dir`).
 * @param {number} expected Expected number of files.
 */
function expectFileCount( dir, label, maxDepth, expected ) {
	const actual = countFiles( dir, maxDepth );
	if ( actual !== expected ) {
		fail(
			`Expected ${ expected } files in ${ label }, but found ${ actual }.`
		);
	}
}

/**
 * Clean up generated test blocks.
 */
function cleanup() {
	fs.rmSync( ES5_BLOCK, { recursive: true, force: true } );
	fs.rmSync( STATIC_BLOCK, { recursive: true, force: true } );
}

process.on( 'exit', cleanup );
process.on( 'SIGINT', () => process.exit( 1 ) );
process.on( 'SIGTERM', () => process.exit( 1 ) );

// First test block.
status( 'Scaffolding Example Static (ES5) block...' );
npmExec( 'wp-create-block', [ 'example-static-es5', '-t', 'es5' ], {
	cwd: ROOT,
} );

status( 'Verifying project...' );
expectFileCount( ES5_BLOCK, 'the project root', 1, 8 );

// Second test block.
status( 'Scaffolding Example Static block...' );
npmExec( 'wp-create-block', [ 'example-static', '--no-wp-scripts' ], {
	cwd: ROOT,
} );

status( 'Verifying project...' );
expectFileCount( STATIC_BLOCK, 'the project root', 1, 5 );
expectFileCount(
	path.join( STATIC_BLOCK, 'src' ),
	'the `src` directory',
	2,
	7
);

/*
 * Write an ESLint flat config that extends wp-scripts' default config but
 * uses the monorepo's custom import resolver. Local @wordpress/* packages
 * export paths pointing to built files (build-module/), but we haven't run
 * a build. The custom resolver maps these to source files (src/) instead.
 */
fs.writeFileSync(
	path.join( STATIC_BLOCK, 'eslint.config.cjs' ),
	`const defaultConfig = require( '@wordpress/scripts/config/eslint.config.cjs' );

module.exports = [
	...defaultConfig,
	{
		settings: {
			'import/resolver': require.resolve(
				'../tools/eslint/import-resolver.cjs'
			),
		},
	},
];
`
);

status( 'Formatting files...' );
wpScripts( 'format' );

status( 'Building block...' );
wpScripts( 'build' );

status( 'Verifying build...' );
expectFileCount(
	path.join( STATIC_BLOCK, 'build' ),
	'the `build` directory',
	2,
	9
);

status( 'Linting CSS files...' );
wpScripts( 'lint-style' );

// Ensure monorepo prelint:js scripts have run (e.g., build design tokens for ESLint).
status( 'Running prelint:js...' );
run( 'npm', [ 'run', 'prelint:js' ], { cwd: ROOT } );

status( 'Linting JavaScript files...' );
wpScripts( 'lint-js' );

status( 'Creating a plugin zip file...' );
wpScripts( 'plugin-zip' );
