/**
 * Live-reload / HMR SSE server for Gutenberg development.
 *
 * Watches `build/` for .js/.css changes (from `npm run dev`) and pushes
 * reload events to the browser via Server-Sent Events on port 35729.
 *
 * Routes:
 *   /events  → SSE stream (changed file list as JSON)
 *   /hmr/*   → static files from build/hmr/ and bin/hmr/
 *   *        → 404
 *
 * On startup, writes a sentinel file at `build/hmr/.live` containing the
 * SSE port. `lib/dev-hmr.php` (loaded by the Gutenberg plugin) checks for
 * this sentinel and, if present, injects the react-refresh runtime and
 * HMR client into wp_head/wp_footer. The sentinel is removed on shutdown,
 * making the PHP-side a no-op when the server isn't running.
 *
 * Usage:  node bin/live-reload.mjs   (run alongside `npm run dev`)
 */

import { createServer } from 'node:http';
// eslint-disable-next-line import/no-extraneous-dependencies -- chokidar is a transitive dep via @wordpress/build / @wordpress/scripts.
import { watch } from 'chokidar';
import { resolve, join } from 'node:path';
import {
	statSync,
	readFileSync,
	existsSync,
	mkdirSync,
	writeFileSync,
	unlinkSync,
} from 'node:fs';

// 35729 is the LiveReload protocol's traditional port (livereload.com).
// Must match bin/hmr/hmr-client.js and the URL in lib/dev-hmr.php (which
// reads the sentinel file at build/hmr/.live for the port number).
const PORT = 35729;
const DEBOUNCE_MS = 50;
const ROOT_DIR = resolve( import.meta.dirname, '..' );
const BUILD_DIR = resolve( ROOT_DIR, 'build' );
const SENTINEL_DIR = join( BUILD_DIR, 'hmr' );
const SENTINEL_PATH = join( SENTINEL_DIR, '.live' );

const clients = new Set();

// --- Sentinel install / cleanup -------------------------------------------

function installSentinel() {
	mkdirSync( SENTINEL_DIR, { recursive: true } );
	writeFileSync( SENTINEL_PATH, String( PORT ) );
	console.log( `Sentinel written to ${ SENTINEL_PATH }` );
}

function removeSentinel() {
	try {
		unlinkSync( SENTINEL_PATH );
	} catch {
		// Best-effort cleanup.
	}
}

// `npm run dev` starts with `clean:packages`, which rimrafs the entire
// build/ directory including our sentinel. If users run `npm run dev:live`
// standalone and then later run `npm run dev`, the sentinel disappears and
// lib/dev-hmr.php no-ops, so the page silently stops getting HMR.
// Watch the sentinel file and rewrite it on unlink. Event-driven (no
// busy polling). `ignoreInitial: true` so the initial 'add' from
// installSentinel() above doesn't fire here.
function watchSentinel() {
	watch( SENTINEL_PATH, { ignoreInitial: true } ).on( 'unlink', () => {
		installSentinel();
	} );
}

// --- Static file serving for HMR assets -----------------------------------

const MIME_TYPES = {
	'.js': 'application/javascript',
	'.mjs': 'application/javascript',
	'.css': 'text/css',
};

/**
 * Serve a static file with CORS headers.
 *
 * @param {string}                        filePath Absolute path to the file.
 * @param {import('http').ServerResponse} res      HTTP response.
 */
function serveFile( filePath, res ) {
	if ( ! existsSync( filePath ) ) {
		res.writeHead( 404 );
		res.end( 'Not found' );
		return;
	}

	const ext = filePath.match( /\.[^.]+$/ )?.[ 0 ] || '';
	const contentType = MIME_TYPES[ ext ] || 'application/octet-stream';

	const content = readFileSync( filePath );
	res.writeHead( 200, {
		'Content-Type': contentType,
		'Cache-Control': 'no-cache',
		'Access-Control-Allow-Origin': '*',
	} );
	res.end( content );
}

// --- HTTP server with routing ---------------------------------------------

const server = createServer( ( req, res ) => {
	const url = new URL( req.url, `http://localhost:${ PORT }` );
	const pathname = url.pathname;

	// SSE endpoint
	if ( pathname === '/events' ) {
		res.writeHead( 200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'Access-Control-Allow-Origin': '*',
		} );
		// Flush headers so the browser fires `onopen` immediately.
		res.write( ':ok\n\n' );

		// If a build error is currently outstanding, replay it to this
		// client so an overlay shows immediately on connect.
		const initialError = readErrorFile();
		if ( initialError ) {
			res.write(
				`data: ${ JSON.stringify( { __error: initialError } ) }\n\n`
			);
		}

		clients.add( res );
		req.on( 'close', () => clients.delete( res ) );
		return;
	}

	// HMR static files
	if ( pathname.startsWith( '/hmr/' ) ) {
		const fileName = pathname.slice( 5 ); // strip "/hmr/"

		// Security: reject path traversal
		if ( fileName.includes( '..' ) || fileName.includes( '/' ) ) {
			res.writeHead( 400 );
			res.end( 'Bad request' );
			return;
		}

		// Try build/hmr/ first (react-refresh-runtime.js), then bin/hmr/ (hmr-client.js)
		const buildPath = join( BUILD_DIR, 'hmr', fileName );
		const binPath = join( ROOT_DIR, 'bin', 'hmr', fileName );

		if ( existsSync( buildPath ) ) {
			serveFile( buildPath, res );
		} else if ( existsSync( binPath ) ) {
			serveFile( binPath, res );
		} else {
			res.writeHead( 404 );
			res.end( 'Not found' );
		}
		return;
	}

	// Everything else
	res.writeHead( 404 );
	res.end( 'Not found' );
} );

server.on( 'error', ( err ) => {
	if ( err.code === 'EADDRINUSE' ) {
		console.error(
			`Port ${ PORT } is already in use. Kill the other process first:\n` +
				`  lsof -ti :${ PORT } | xargs kill`
		);
		process.exit( 1 );
	}
	throw err;
} );

// Bind to loopback only. This is a dev-only service that doesn't need to be
// reachable from other machines on the LAN, and binding to all interfaces
// would expose file-change events to anyone on the network.
server.listen( PORT, '127.0.0.1', () => {
	console.log(
		`Live-reload SSE server listening on http://127.0.0.1:${ PORT }`
	);
	console.log( `Watching ${ BUILD_DIR } for changes…` );

	installSentinel();
	watchSentinel();
} );

// --- File watcher ---------------------------------------------------------

let debounceTimer;
const pendingChanges = new Set();

watch( BUILD_DIR, {
	ignoreInitial: true,
	ignored: ( watchPath ) => {
		try {
			if ( statSync( watchPath ).isDirectory() ) {
				return false;
			}
		} catch {}
		return ! /\.(js|css)$/.test( watchPath );
	},
} ).on( 'all', ( event, watchPath ) => {
	const short = watchPath.replace( BUILD_DIR + '/', '' );
	pendingChanges.add( short );

	clearTimeout( debounceTimer );
	debounceTimer = setTimeout( () => {
		const files = Array.from( pendingChanges );
		pendingChanges.clear();

		console.log( `HMR → ${ files.join( ', ' ) } (${ event })` );

		const payload = JSON.stringify( { files } );
		for ( const client of clients ) {
			client.write( `data: ${ payload }\n\n` );
		}
	}, DEBOUNCE_MS );
} );

// --- Build-error reporting -------------------------------------------------
//
// wp-build writes build/hmr/error.json on rebuild failure and removes the
// file on the next successful rebuild. Mirror that into SSE messages of
// shape { __error: {...} } or { __error: null } so the client can show /
// hide an overlay.

const ERROR_FILE = join( SENTINEL_DIR, 'error.json' );

function broadcastError( error ) {
	const payload = JSON.stringify( { __error: error } );
	for ( const client of clients ) {
		client.write( `data: ${ payload }\n\n` );
	}
}

function readErrorFile() {
	try {
		const raw = readFileSync( ERROR_FILE, 'utf8' );
		return JSON.parse( raw );
	} catch {
		return null;
	}
}

watch( ERROR_FILE, { ignoreInitial: false } )
	.on( 'add', () => broadcastError( readErrorFile() ) )
	.on( 'change', () => broadcastError( readErrorFile() ) )
	.on( 'unlink', () => broadcastError( null ) );

// --- Cleanup on exit ------------------------------------------------------

function cleanup() {
	removeSentinel();
	process.exit();
}

process.on( 'SIGINT', cleanup );
process.on( 'SIGTERM', cleanup );
