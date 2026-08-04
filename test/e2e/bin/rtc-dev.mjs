#!/usr/bin/env node

/**
 * Local RTC transport switcher.
 *
 * Four modes, selected by --mode=<websockets|http|long-polling|php-websockets>:
 *
 *   websockets: mount the test WebSocket provider plugin into the dev
 *   wp-env, activate it, then run the same y-websocket sync server the
 *   e2e suite uses. Open the printed wp-admin URL in two browser windows
 *   to collaborate over WebSockets. (The site port is resolved from the
 *   running environment, since `wp-env start --auto-port` varies it per
 *   worktree.)
 *
 *   long-polling: select the experimental built-in HTTP long-polling
 *   transport by setting the WP_COLLABORATION_TRANSPORT constant via
 *   .wp-env.override.json. No extra server process is needed; requests to
 *   wp-sync/v1/long-poll are held open by WordPress itself.
 *
 *   php-websockets: select the experimental built-in PHP WebSocket
 *   transport (same constant), then run the PHP sync server inside the dev
 *   wp-env cli container with port 8787 published to the host (matching
 *   the default wp_get_collaboration_websocket_url()).
 *
 *   http: tear all of that down so RTC falls back to the built-in HTTP
 *   polling provider. Deactivates the plugin, removes the mount, and
 *   clears the transport constant.
 *
 * The mount and the transport constant live in .wp-env.override.json
 * (gitignored, auto-merged by wp-env) so we never touch the checked-in
 * .wp-env.json. Other override entries the user already has are preserved.
 * Changing the constant re-provisions wp-config.php, so modes that touch it
 * run `wp-env start` to apply.
 */

import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
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
const PHP_WS_SERVER_SCRIPT = path.join(
	__dirname,
	'rtc-php-ws-sync-server.mjs'
);
const OVERRIDE_FILE = path.join( REPO_ROOT, '.wp-env.override.json' );
const TRANSPORT_CONSTANT = 'WP_COLLABORATION_TRANSPORT';
const MOUNT_TARGET = 'wp-content/plugins/gutenberg-test-plugins';
const MOUNT_SOURCE = './packages/e2e-tests/plugins';
const PLUGIN_SLUG = 'gutenberg-test-plugins/rtc-websocket-provider';

const nodeRequire = createRequire( path.join( REPO_ROOT, 'package.json' ) );

const DEFAULT_WS_PORT = 18991;
const WS_PORT = Number.parseInt(
	process.env.GUTENBERG_RTC_TEST_WS_PORT || String( DEFAULT_WS_PORT ),
	10
);
const WS_URL =
	process.env.GUTENBERG_RTC_TEST_WS_URL || `ws://127.0.0.1:${ WS_PORT }`;

const MODES = [ 'websockets', 'http', 'long-polling', 'php-websockets' ];

function parseMode() {
	const arg = process.argv.find( ( a ) => a.startsWith( '--mode=' ) );
	const mode = arg ? arg.slice( '--mode='.length ) : 'websockets';
	if ( ! MODES.includes( mode ) ) {
		throw new Error(
			`Unknown --mode=${ mode }. Expected one of: ${ MODES.join(
				', '
			) }.`
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

/**
 * Set the transport constant in .wp-env.override.json's `config` block.
 *
 * @param {string} value Transport identifier.
 * @return {Promise<boolean>} Whether the override file changed.
 */
async function ensureTransportConstant( value ) {
	const existing = ( await readOverride() ) || {};
	const config = { ...( existing.config || {} ) };
	if ( config[ TRANSPORT_CONSTANT ] === value ) {
		return false;
	}
	config[ TRANSPORT_CONSTANT ] = value;
	await writeOverride( { ...existing, config } );
	return true;
}

/**
 * Remove the transport constant from .wp-env.override.json, restoring the
 * default http-polling transport.
 *
 * @return {Promise<boolean>} Whether the override file changed.
 */
async function ensureTransportConstantRemoved() {
	const existing = await readOverride();
	if ( ! existing || ! existing.config ) {
		return false;
	}
	if ( ! ( TRANSPORT_CONSTANT in existing.config ) ) {
		return false;
	}
	const { [ TRANSPORT_CONSTANT ]: removed, ...rest } = existing.config;
	const next = { ...existing };
	if ( Object.keys( rest ).length > 0 ) {
		next.config = rest;
	} else {
		delete next.config;
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

/**
 * Resolve the dev site's wp-admin URL from the running environment.
 *
 * With `wp-env start --auto-port` (used across parallel worktrees) the site
 * port varies per worktree, so ask docker for the actual published port of
 * the wordpress service instead of assuming 8888. Falls back to 8888 when
 * the environment can't be inspected (e.g. not running yet).
 *
 * @return {Promise<string>} The wp-admin URL for the dev environment.
 */
async function getDevAdminUrl() {
	try {
		const { loadConfig } = nodeRequire( '@wordpress/env/lib/config' );
		const config = await loadConfig(
			REPO_ROOT,
			path.join( REPO_ROOT, '.wp-env.json' )
		);
		const composeFile = path.join(
			config.workDirectoryPath,
			'docker-compose.yml'
		);
		const output = execFileSync(
			'docker',
			[ 'compose', '-f', composeFile, 'port', 'wordpress', '80' ],
			{ encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'ignore' ] }
		).trim();
		const port = output.split( ':' ).pop();
		if ( /^\d+$/.test( port ) ) {
			return `http://localhost:${ port }/wp-admin`;
		}
	} catch {
		// Fall through to the default below.
	}
	return 'http://localhost:8888/wp-admin';
}

async function runWebSocketsMode() {
	// The test provider replaces the default via the sync.providers filter;
	// the built-in transport must stay on its default so the two don't fight.
	const constantRemoved = await ensureTransportConstantRemoved();
	const mountAdded = ( await ensureMountAdded() ) || constantRemoved;
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

	const adminUrl = await getDevAdminUrl();
	process.stdout.write(
		`\nRTC ready on WebSockets. Open two windows at ${ adminUrl } and edit the same post.\n` +
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

	const constantRemoved = await ensureTransportConstantRemoved();
	const mountRemoved = ( await ensureMountRemoved() ) || constantRemoved;
	if ( mountRemoved ) {
		process.stdout.write(
			'Updated .wp-env.override.json. Restarting wp-env... '
		);
		await runCommand( 'npx', [ 'wp-env', 'start' ] );
		process.stdout.write( 'done\n' );
	} else {
		process.stdout.write( 'No overrides to remove.\n' );
	}

	process.stdout.write(
		`\nRTC switched to HTTP polling (default). ${ await getDevAdminUrl() }\n`
	);
}

/**
 * Select a built-in experimental transport by constant, deactivating the
 * test WebSocket provider plugin first so it doesn't override the choice.
 *
 * @param {string} transport Transport identifier for WP_COLLABORATION_TRANSPORT.
 */
async function selectBuiltInTransport( transport ) {
	process.stdout.write( 'Deactivating RTC test plugin (if active)... ' );
	await runWpCli( [ 'plugin', 'deactivate', PLUGIN_SLUG ], {
		allowFailure: true,
	} );
	process.stdout.write( 'done\n' );

	const constantChanged = await ensureTransportConstant( transport );
	if ( constantChanged ) {
		process.stdout.write(
			`Set ${ TRANSPORT_CONSTANT }=${ transport } in .wp-env.override.json. Restarting wp-env... `
		);
	} else {
		process.stdout.write( 'Ensuring wp-env is running... ' );
	}
	await runCommand( 'npx', [ 'wp-env', 'start' ] );
	process.stdout.write( 'done\n' );

	process.stdout.write( 'Enabling collaboration option... ' );
	await runWpCli( [ 'option', 'update', 'wp_collaboration_enabled', '1' ] );
	process.stdout.write( 'done\n' );
}

async function runLongPollingMode() {
	await selectBuiltInTransport( 'http-long-polling' );

	const adminUrl = await getDevAdminUrl();
	process.stdout.write(
		`\nRTC ready on HTTP long polling. Open two windows at ${ adminUrl } and edit the same post.\n` +
			'Idle wp-sync/v1/long-poll requests are held open for up to 20s; local edits abort and resend immediately.\n' +
			'Switch back with `npm run rtc:http`.\n\n'
	);
}

async function runPhpWebSocketsMode() {
	await selectBuiltInTransport( 'php-websocket' );

	// Runs `wp collaboration sync-server` inside the dev wp-env cli
	// container with port 8787 published to the host (the default port in
	// wp_get_collaboration_websocket_url(), so no URL filter is needed).
	const server = spawn(
		process.execPath,
		[ PHP_WS_SERVER_SCRIPT, '--env', 'dev' ],
		{ stdio: [ 'pipe', 'inherit', 'inherit' ] }
	);

	const shutdown = () => {
		// Closing stdin lets the launcher's in-container watchdog stop the
		// docker container before the launcher exits.
		try {
			server.stdin?.end();
		} catch {
			// Already closed.
		}
		if ( ! server.killed ) {
			server.kill( 'SIGTERM' );
		}
	};
	process.on( 'SIGINT', shutdown );
	process.on( 'SIGTERM', shutdown );

	const adminUrl = await getDevAdminUrl();
	process.stdout.write(
		'\nRTC ready on the experimental PHP WebSocket transport once the server below reports listening.\n' +
			`Open two windows at ${ adminUrl } and edit the same post (ws://localhost:8787).\n` +
			'Press Ctrl+C to stop the sync server. Switch back with `npm run rtc:http`.\n\n'
	);

	const [ code ] = await once( server, 'exit' );
	process.exit( code ?? 0 );
}

async function main() {
	const mode = parseMode();
	if ( mode === 'websockets' ) {
		await runWebSocketsMode();
		return;
	}
	if ( mode === 'long-polling' ) {
		await runLongPollingMode();
		return;
	}
	if ( mode === 'php-websockets' ) {
		await runPhpWebSocketsMode();
		return;
	}
	await runHttpMode();
}

main().catch( ( error ) => {
	process.stderr.write( `${ error.message || error }\n` );
	process.exit( 1 );
} );
