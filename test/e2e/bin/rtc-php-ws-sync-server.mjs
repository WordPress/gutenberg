#!/usr/bin/env node

/**
 * Launches the experimental PHP WebSocket sync server for RTC.
 *
 * Starts `wp collaboration sync-server` inside a wp-env environment's cli
 * service with the WebSocket port published to the host, so a browser on the
 * host can connect to ws://localhost:<port>. This is needed because wp-env
 * itself offers no way to expose extra container ports (`wp-env run cli …`
 * does not publish them).
 *
 * Environments (--env, default "tests"):
 * - tests: the e2e environment (.wp-env.test.json, browser at
 *   localhost:8889, default port 18992). Used by
 *   playwright.rtc-php-websocket.config.ts, whose webServer entry polls the
 *   server's plain HTTP GET /health endpoint as its readiness check.
 * - dev: the development environment (.wp-env.json, browser at
 *   localhost:8888, default port 8787). For manual testing:
 *   `npm run rtc:php-ws-server`. Port 8787 matches the default URL from
 *   wp_get_collaboration_websocket_url(), so with the
 *   WP_COLLABORATION_TRANSPORT=php-websocket constant set no URL filter is
 *   needed.
 */

import { execFileSync, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '../../..' );

const require = createRequire( path.join( ROOT_DIR, 'package.json' ) );

function parseEnvArg() {
	const envIndex = process.argv.indexOf( '--env' );
	const rawEnv = envIndex === -1 ? 'tests' : process.argv[ envIndex + 1 ];

	if ( 'tests' === rawEnv ) {
		return { configFile: '.wp-env.test.json', defaultPort: 18992 };
	}
	if ( 'dev' === rawEnv ) {
		return { configFile: '.wp-env.json', defaultPort: 8787 };
	}
	throw new Error( `Invalid --env: ${ rawEnv } (expected "dev" or "tests")` );
}

const WP_ENV = parseEnvArg();

function parsePortArg() {
	const portIndex = process.argv.indexOf( '--port' );
	const rawPort =
		portIndex === -1
			? process.env.GUTENBERG_RTC_PHP_WS_PORT
			: process.argv[ portIndex + 1 ];

	if ( ! rawPort ) {
		return WP_ENV.defaultPort;
	}

	const port = Number.parseInt( rawPort, 10 );
	if ( ! Number.isInteger( port ) || port <= 0 ) {
		throw new Error( `Invalid port: ${ rawPort }` );
	}
	return port;
}

const PORT = parsePortArg();
const CONTAINER_NAME = `gutenberg-rtc-php-ws-sync-server-${ PORT }`;

/**
 * Resolve the wp-env environment install path using wp-env's own config
 * loader (the CLI's install-path command produces no output when invoked
 * non-interactively).
 */
async function getWpEnvInstallPath() {
	// Resolved from the repo root, where wp-env is a devDependency.
	// eslint-disable-next-line import/no-extraneous-dependencies
	const { loadConfig } = require( '@wordpress/env/lib/config' );
	const config = await loadConfig(
		ROOT_DIR,
		path.join( ROOT_DIR, WP_ENV.configFile )
	);
	return config.workDirectoryPath;
}

function sleep( ms ) {
	return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
}

function getRunningServices( composeFile ) {
	try {
		return execFileSync(
			'docker',
			[
				'compose',
				'-f',
				composeFile,
				'ps',
				'--status',
				'running',
				'--services',
			],
			{ encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'ignore' ] }
		)
			.split( '\n' )
			.map( ( line ) => line.trim() )
			.filter( Boolean );
	} catch {
		return [];
	}
}

/**
 * Wait for the wp-env environment to be up. In e2e runs the base Playwright
 * webServer entry runs `wp-env start` concurrently with this launcher, so
 * poll rather than racing a second `wp-env start` invocation.
 *
 * @param {string} composeFile Path to the wp-env docker-compose.yml.
 */
async function waitForEnvironment( composeFile ) {
	const deadline = Date.now() + 150_000;

	while ( Date.now() < deadline ) {
		if ( existsSync( composeFile ) ) {
			const services = getRunningServices( composeFile );
			if (
				services.includes( 'wordpress' ) &&
				services.includes( 'mysql' )
			) {
				return;
			}
		}

		await sleep( 2000 );
	}

	throw new Error(
		`Timed out waiting for the wp-env environment (${ WP_ENV.configFile }) to start. Is it running? Try \`wp-env start\`.`
	);
}

function removeStaleContainer() {
	try {
		execFileSync( 'docker', [ 'rm', '-f', CONTAINER_NAME ], {
			stdio: 'ignore',
		} );
	} catch {
		// No stale container to remove.
	}
}

async function main() {
	const installPath = await getWpEnvInstallPath();
	const composeFile = path.join( installPath, 'docker-compose.yml' );

	console.log(
		`[rtc-php-ws] Waiting for wp-env environment (${ composeFile })…`
	);
	await waitForEnvironment( composeFile );

	removeStaleContainer();

	console.log(
		`[rtc-php-ws] Starting PHP WebSocket sync server on port ${ PORT }…`
	);

	/*
	 * Run the sync server behind a stdin watchdog. Playwright tears the
	 * launcher down with SIGKILL, which leaves no chance to stop the
	 * container explicitly; when the launcher dies, its stdin pipe to the
	 * docker CLI closes, `cat` sees EOF, and the container shuts itself
	 * down (and `--rm` removes it).
	 */
	const watchdogScript = [
		`wp collaboration sync-server --host=0.0.0.0 --port=${ PORT } &`,
		'server=$!',
		'cat > /dev/null',
		'kill "$server" 2>/dev/null',
		'wait "$server" 2>/dev/null',
	].join( '\n' );

	const child = spawn(
		'docker',
		[
			'compose',
			'-f',
			composeFile,
			'run',
			'--rm',
			'--no-deps',
			'-T',
			'--name',
			CONTAINER_NAME,
			'-p',
			`${ PORT }:${ PORT }`,
			'cli',
			'sh',
			'-c',
			watchdogScript,
		],
		{ stdio: [ 'pipe', 'inherit', 'inherit' ] }
	);

	const shutdown = () => {
		// Closing stdin triggers the in-container watchdog.
		try {
			child.stdin?.end();
		} catch {
			// Already closed.
		}
		removeStaleContainer();
		if ( ! child.killed ) {
			child.kill( 'SIGTERM' );
		}
	};

	process.on( 'SIGINT', () => {
		shutdown();
		process.exit( 130 );
	} );
	process.on( 'SIGTERM', () => {
		shutdown();
		process.exit( 143 );
	} );
	process.on( 'exit', shutdown );

	child.on( 'exit', ( code ) => {
		process.exitCode = code ?? 1;
	} );
}

main().catch( ( error ) => {
	console.error( `[rtc-php-ws] ${ error.message }` );
	process.exit( 1 );
} );
