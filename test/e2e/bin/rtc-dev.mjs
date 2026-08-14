#!/usr/bin/env node

/**
 * Local RTC transport switcher.
 *
 * Two modes, selected by --mode=<websockets|http>:
 *
 *   websockets: mount the test WebSocket provider plugin into the dev
 *   wp-env, activate it, then run the same y-websocket sync server the
 *   e2e suite uses. Open http://localhost:8888/wp-admin in two browser
 *   windows to collaborate over WebSockets.
 *
 *   http: tear that down so RTC falls back to the built-in HTTP polling
 *   provider. Deactivates the plugin and removes the mount.
 *
 * The mount lives in .wp-env.override.json (gitignored, auto-merged by
 * wp-env) so we never touch the checked-in .wp-env.json. Other override
 * entries the user already has are preserved.
 */

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { build as esbuildBuild } from 'esbuild';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const REPO_ROOT = path.resolve( __dirname, '../../..' );
const PROVIDER_DIR = path.join(
	REPO_ROOT,
	'packages/e2e-tests/plugins/rtc-websocket-provider'
);
const WS_SERVER_SCRIPT = path.join( __dirname, 'rtc-test-ws-sync-server.mjs' );
const OVERRIDE_FILE = path.join( REPO_ROOT, '.wp-env.override.json' );
const MOUNT_TARGET = 'wp-content/plugins/gutenberg-test-plugins';
const MOUNT_SOURCE = './packages/e2e-tests/plugins';
const PLUGIN_SLUG = 'gutenberg-test-plugins/rtc-websocket-provider';

const DEFAULT_WS_PORT = 18991;
const WS_PORT = Number.parseInt(
	process.env.GUTENBERG_RTC_TEST_WS_PORT || String( DEFAULT_WS_PORT ),
	10
);
const WS_URL =
	process.env.GUTENBERG_RTC_TEST_WS_URL || `ws://127.0.0.1:${ WS_PORT }`;

function parseMode() {
	const arg = process.argv.find( ( a ) => a.startsWith( '--mode=' ) );
	const mode = arg ? arg.slice( '--mode='.length ) : 'websockets';
	if ( mode !== 'websockets' && mode !== 'http' ) {
		throw new Error(
			`Unknown --mode=${ mode }. Expected "websockets" or "http".`
		);
	}
	return mode;
}

async function readOverride() {
	try {
		const raw = await fs.readFile( OVERRIDE_FILE, 'utf8' );
		const parsed = JSON.parse( raw );
		if (
			parsed &&
			typeof parsed === 'object' &&
			! Array.isArray( parsed )
		) {
			return parsed;
		}
		throw new Error(
			`${ OVERRIDE_FILE } is not a JSON object; refusing to edit.`
		);
	} catch ( error ) {
		if ( error.code === 'ENOENT' ) {
			return null;
		}
		throw error;
	}
}

async function writeOverride( data ) {
	const isEmpty =
		! data ||
		( Object.keys( data ).length === 0 && data.constructor === Object );

	if ( isEmpty ) {
		try {
			await fs.unlink( OVERRIDE_FILE );
		} catch ( error ) {
			if ( error.code !== 'ENOENT' ) {
				throw error;
			}
		}
		return;
	}

	await fs.writeFile(
		OVERRIDE_FILE,
		JSON.stringify( data, null, '\t' ) + '\n'
	);
}

async function ensureMountAdded() {
	const existing = ( await readOverride() ) || {};
	const mappings = { ...( existing.mappings || {} ) };
	if ( mappings[ MOUNT_TARGET ] === MOUNT_SOURCE ) {
		return false;
	}
	mappings[ MOUNT_TARGET ] = MOUNT_SOURCE;
	await writeOverride( { ...existing, mappings } );
	return true;
}

async function ensureMountRemoved() {
	const existing = await readOverride();
	if ( ! existing || ! existing.mappings ) {
		return false;
	}
	if ( ! ( MOUNT_TARGET in existing.mappings ) ) {
		return false;
	}
	const { [ MOUNT_TARGET ]: removed, ...rest } = existing.mappings;
	const next = { ...existing };
	if ( Object.keys( rest ).length > 0 ) {
		next.mappings = rest;
	} else {
		delete next.mappings;
	}
	await writeOverride( next );
	return true;
}

function runCommand( command, args, options = {} ) {
	return new Promise( ( resolve, reject ) => {
		const child = spawn( command, args, {
			cwd: REPO_ROOT,
			stdio: options.stdio || [ 'ignore', 'pipe', 'pipe' ],
		} );

		let stderr = '';
		if ( child.stderr ) {
			child.stderr.on( 'data', ( chunk ) => {
				stderr += chunk.toString();
			} );
		}
		child.on( 'error', reject );
		child.on( 'exit', ( code ) => {
			if ( code === 0 ) {
				resolve();
				return;
			}
			reject(
				new Error(
					`${ command } ${ args.join(
						' '
					) } exited with code ${ code }\n${ stderr }`
				)
			);
		} );
	} );
}

function runWpCli( wpArgs, { allowFailure = false } = {} ) {
	const promise = runCommand( 'npx', [
		'wp-env',
		'run',
		'cli',
		'wp',
		...wpArgs,
	] );
	if ( ! allowFailure ) {
		return promise;
	}
	return promise.catch( () => undefined );
}

async function buildProviderBundle() {
	process.stdout.write( 'Building provider bundle... ' );
	await esbuildBuild( {
		entryPoints: [ path.join( PROVIDER_DIR, 'src/index.js' ) ],
		outfile: path.join( PROVIDER_DIR, 'build/index.js' ),
		bundle: true,
		format: 'iife',
		target: 'es2020',
		alias: { yjs: path.join( PROVIDER_DIR, 'src/yjs-external.js' ) },
		logLevel: 'warning',
	} );
	process.stdout.write( 'done\n' );
}

async function writeRuntimeConfig() {
	const configPath = path.join( PROVIDER_DIR, 'build/runtime-config.json' );
	await fs.mkdir( path.dirname( configPath ), { recursive: true } );
	await fs.writeFile( configPath, JSON.stringify( { url: WS_URL } ) + '\n' );
}

async function runWebSocketsMode() {
	const mountAdded = await ensureMountAdded();
	if ( mountAdded ) {
		process.stdout.write(
			'Added mount to .wp-env.override.json. Restarting wp-env... '
		);
	} else {
		process.stdout.write( 'Ensuring wp-env is running... ' );
	}
	await runCommand( 'npx', [ 'wp-env', 'start' ] );
	process.stdout.write( 'done\n' );

	await buildProviderBundle();
	await writeRuntimeConfig();

	process.stdout.write( 'Activating RTC test plugin... ' );
	await runWpCli( [ 'plugin', 'activate', PLUGIN_SLUG ] );
	process.stdout.write( 'done\n' );

	process.stdout.write( 'Enabling collaboration option... ' );
	await runWpCli( [ 'option', 'update', 'wp_collaboration_enabled', '1' ] );
	process.stdout.write( 'done\n' );

	const server = spawn(
		process.execPath,
		[ WS_SERVER_SCRIPT, '--port', String( WS_PORT ) ],
		{ stdio: 'inherit' }
	);

	const shutdown = () => {
		if ( ! server.killed ) {
			server.kill( 'SIGTERM' );
		}
	};
	process.on( 'SIGINT', shutdown );
	process.on( 'SIGTERM', shutdown );

	process.stdout.write(
		'\nRTC ready on WebSockets. Open two windows at http://localhost:8888/wp-admin and edit the same post.\n' +
			( process.env.RTC_WS_DELAY
				? `WebSocket send delay: ${ process.env.RTC_WS_DELAY }ms.\n`
				: '' ) +
			'Press Ctrl+C to stop the WebSocket server. The plugin stays active until you run `npm run rtc:http`.\n\n'
	);

	const [ code ] = await once( server, 'exit' );
	process.exit( code ?? 0 );
}

async function runHttpMode() {
	process.stdout.write( 'Deactivating RTC test plugin (if active)... ' );
	await runWpCli( [ 'plugin', 'deactivate', PLUGIN_SLUG ], {
		allowFailure: true,
	} );
	process.stdout.write( 'done\n' );

	const mountRemoved = await ensureMountRemoved();
	if ( mountRemoved ) {
		process.stdout.write(
			'Removed mount from .wp-env.override.json. Restarting wp-env... '
		);
		await runCommand( 'npx', [ 'wp-env', 'start' ] );
		process.stdout.write( 'done\n' );
	} else {
		process.stdout.write( 'No mount to remove.\n' );
	}

	process.stdout.write(
		'\nRTC switched to HTTP polling (default). http://localhost:8888/wp-admin\n'
	);
}

async function main() {
	const mode = parseMode();
	if ( mode === 'websockets' ) {
		await runWebSocketsMode();
		return;
	}
	await runHttpMode();
}

main().catch( ( error ) => {
	process.stderr.write( `${ error.message || error }\n` );
	process.exit( 1 );
} );
