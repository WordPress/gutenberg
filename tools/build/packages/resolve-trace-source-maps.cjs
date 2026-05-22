#!/usr/bin/env node

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { SourceMapConsumer } = require( 'source-map' );

const USAGE = `Usage: node tools/build/packages/resolve-trace-source-maps.cjs <trace.json> [--build-dir <dir>] [--out <path>]

Rewrites minified \`functionName\`s in a saved Chromium trace's CPU profile
nodes back to their original identifiers using source maps from a
gutenberg \`build/\` directory.

The default --build-dir is \`<traceDir>/../build\` — the layout produced by
unzipping the \`performance-traces\` CI artifact, which ships the source maps
alongside the trace files. No \`npm run build\` required.

Arguments
  <trace.json>          Path to the trace file produced by the perf tests.

Options
  --build-dir <dir>     Directory containing the gutenberg build outputs
                        (looks for \`scripts/<pkg>/*.map\`). Defaults to the
                        \`build\` directory sibling of the trace's directory.
  --out <path>          Output path. Defaults to the input filename with the
                        \`.trace.json\` suffix replaced by \`.deminified.trace.json\`.
`;

/**
 * @param {string[]} argv Command-line arguments.
 * @return {{ positional: string[], buildDir: string | null, out: string | null }} Parsed args.
 */
function parseArgs( argv ) {
	/** @type {{ positional: string[], buildDir: string | null, out: string | null }} */
	const args = { positional: [], buildDir: null, out: null };
	for ( let i = 0; i < argv.length; i++ ) {
		const arg = argv[ i ];
		if ( arg === '--build-dir' ) {
			args.buildDir = argv[ ++i ];
		} else if ( arg === '--out' ) {
			args.out = argv[ ++i ];
		} else if ( arg === '-h' || arg === '--help' ) {
			process.stdout.write( USAGE );
			process.exit( 0 );
		} else {
			args.positional.push( arg );
		}
	}
	return args;
}

/**
 * Map a script URL captured in a trace back to a local `.map` file path.
 *
 * Trace URLs look like
 *   http://localhost:8889/wp-content/plugins/<slug>/build/scripts/<pkg>/index.min.js?ver=…
 * which corresponds on disk to
 *   <build-dir>/scripts/<pkg>/index.min.js.map
 *
 * @param {string} url      Script URL from the trace.
 * @param {string} buildDir Local path to the gutenberg `build/` directory.
 * @return {string|null} Local `.map` file path, or null if the URL doesn't
 *                       look like a gutenberg-served script.
 */
function mapUrlToLocalPath( url, buildDir ) {
	let parsed;
	try {
		parsed = new URL( url );
	} catch {
		return null;
	}
	const match = parsed.pathname.match(
		/\/wp-content\/plugins\/[^/]+\/build\/(.+)$/
	);
	if ( ! match ) {
		return null;
	}
	return path.join( buildDir, `${ match[ 1 ] }.map` );
}

/**
 * @param {string} url      Script URL from the trace.
 * @param {string} buildDir Local path to the gutenberg `build/` directory.
 * @return {Promise<string | null>} Source map text, or null when missing.
 */
async function readMap( url, buildDir ) {
	const localPath = mapUrlToLocalPath( url, buildDir );
	if ( ! localPath ) {
		return null;
	}
	try {
		return await fs.promises.readFile( localPath, 'utf8' );
	} catch {
		return null;
	}
}

/**
 * @param {any}    trace    Parsed trace JSON, mutated in place.
 * @param {string} buildDir Local path to the gutenberg `build/` directory.
 * @return {Promise<{ resolved: number, missing: number, rewritten: number }>} Counters.
 */
async function resolveTrace( trace, buildDir ) {
	const events = Array.isArray( trace.traceEvents ) ? trace.traceEvents : [];

	/** @type {Set<string>} */
	const urls = new Set();
	for ( const event of events ) {
		const nodes = event?.args?.data?.cpuProfile?.nodes;
		if ( ! nodes ) {
			continue;
		}
		for ( const node of nodes ) {
			const url = node?.callFrame?.url;
			if ( url ) {
				urls.add( url );
			}
		}
	}

	const consumers = new Map();
	let resolved = 0;
	let missing = 0;
	await Promise.all(
		[ ...urls ].map( async ( url ) => {
			const mapText = await readMap( url, buildDir );
			if ( ! mapText ) {
				consumers.set( url, null );
				missing++;
				return;
			}
			try {
				consumers.set(
					url,
					new SourceMapConsumer( JSON.parse( mapText ) )
				);
				resolved++;
			} catch {
				consumers.set( url, null );
				missing++;
			}
		} )
	);

	let rewritten = 0;
	for ( const event of events ) {
		const nodes = event?.args?.data?.cpuProfile?.nodes;
		if ( ! nodes ) {
			continue;
		}
		for ( const node of nodes ) {
			const frame = node?.callFrame;
			if ( ! frame || ! frame.url ) {
				continue;
			}
			const consumer = consumers.get( frame.url );
			if ( ! consumer ) {
				continue;
			}
			const original = consumer.originalPositionFor( {
				line: ( frame.lineNumber ?? 0 ) + 1,
				column: frame.columnNumber ?? 0,
			} );
			if ( original.name ) {
				frame.functionName = original.name;
				rewritten++;
			} else if (
				( ! frame.functionName || frame.functionName.length <= 2 ) &&
				original.source
			) {
				frame.functionName = `(${ original.source }:${
					original.line ?? '?'
				})`;
				rewritten++;
			}
		}
	}

	return { resolved, missing, rewritten };
}

async function main() {
	const args = parseArgs( process.argv.slice( 2 ) );
	if ( args.positional.length !== 1 ) {
		process.stderr.write( USAGE );
		process.exit( 1 );
	}

	const tracePath = path.resolve( args.positional[ 0 ] );
	const buildDir = path.resolve(
		args.buildDir || path.join( path.dirname( tracePath ), '..', 'build' )
	);

	if ( ! fs.existsSync( buildDir ) ) {
		process.stderr.write(
			`Build directory not found: ${ buildDir }\nPass --build-dir, or run from a directory next to the artifact's \`build\` folder.\n`
		);
		process.exit( 1 );
	}

	const trace = JSON.parse( await fs.promises.readFile( tracePath, 'utf8' ) );

	const start = Date.now();
	const { resolved, missing, rewritten } = await resolveTrace(
		trace,
		buildDir
	);
	const elapsed = ( ( Date.now() - start ) / 1000 ).toFixed( 1 );

	const outPath =
		args.out ||
		tracePath.replace( /\.trace\.json$/, '.deminified.trace.json' );
	await fs.promises.writeFile( outPath, JSON.stringify( trace ) );

	process.stdout.write(
		`Resolved ${ resolved } source map(s), missing ${ missing }, rewrote ${ rewritten } frame(s) in ${ elapsed }s.\nWrote ${ outPath }\n`
	);
}

main().catch( ( err ) => {
	process.stderr.write( `${ err.stack || err.message }\n` );
	process.exit( 1 );
} );
