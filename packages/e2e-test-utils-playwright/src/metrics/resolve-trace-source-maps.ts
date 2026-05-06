/**
 * External dependencies
 */
import { SourceMapConsumer, type RawSourceMap } from 'source-map';

interface CallFrame {
	functionName?: string;
	url?: string;
	lineNumber?: number;
	columnNumber?: number;
}

interface ProfileNode {
	callFrame: CallFrame;
}

interface TraceEvent {
	name?: string;
	args?: {
		data?: {
			cpuProfile?: { nodes?: ProfileNode[] };
		};
	};
}

interface RawTrace {
	traceEvents?: TraceEvent[];
}

/**
 * Walk a Chromium trace and replace minified `functionName`s in CPU profile
 * call frames with their original names from source maps fetched over HTTP.
 *
 * Best-effort: any URL whose source map cannot be fetched or parsed is left
 * untouched. The caller passes a `fetchMap` to avoid coupling this module to
 * a particular HTTP client.
 *
 * @param trace    Parsed Chromium trace, mutated in place.
 * @param fetchMap Callback that fetches a source map for a script URL.
 */
export async function resolveTraceSourceMaps(
	trace: RawTrace,
	fetchMap: ( url: string ) => Promise< string | null >
): Promise< void > {
	const events = trace.traceEvents;
	if ( ! Array.isArray( events ) ) {
		return;
	}

	// Collect every unique script URL referenced from a CPU-profile node.
	const urls = new Set< string >();
	for ( const event of events ) {
		const nodes = event.args?.data?.cpuProfile?.nodes;
		if ( ! nodes ) {
			continue;
		}
		for ( const node of nodes ) {
			const url = node.callFrame?.url;
			if ( url ) {
				urls.add( url );
			}
		}
	}

	if ( urls.size === 0 ) {
		return;
	}

	// Fetch and parse each source map in parallel. Failures are kept as null.
	const consumers = new Map< string, SourceMapConsumer | null >();
	await Promise.all(
		[ ...urls ].map( async ( url ) => {
			let mapText: string | null = null;
			try {
				mapText = await fetchMap( url );
			} catch {
				mapText = null;
			}
			if ( ! mapText ) {
				consumers.set( url, null );
				return;
			}
			try {
				const parsed = JSON.parse( mapText ) as RawSourceMap;
				consumers.set( url, new SourceMapConsumer( parsed ) );
			} catch {
				consumers.set( url, null );
			}
		} )
	);

	for ( const event of events ) {
		const nodes = event.args?.data?.cpuProfile?.nodes;
		if ( ! nodes ) {
			continue;
		}
		for ( const node of nodes ) {
			rewriteCallFrame( node.callFrame, consumers );
		}
	}
}

function rewriteCallFrame(
	frame: CallFrame | undefined,
	consumers: Map< string, SourceMapConsumer | null >
): void {
	if ( ! frame || ! frame.url ) {
		return;
	}
	const consumer = consumers.get( frame.url );
	if ( ! consumer ) {
		return;
	}

	// Trace call frames use 0-indexed line/column; SourceMapConsumer expects
	// 1-indexed lines and 0-indexed columns.
	const original = consumer.originalPositionFor( {
		line: ( frame.lineNumber ?? 0 ) + 1,
		column: frame.columnNumber ?? 0,
	} );

	if ( original.name ) {
		frame.functionName = original.name;
	} else if (
		( ! frame.functionName || frame.functionName.length <= 2 ) &&
		original.source
	) {
		// No original name available (anonymous/arrow function). Keep the
		// minified name when it's a meaningful word, otherwise fall back to
		// the original source location for at least *some* readability.
		frame.functionName = `(${ original.source }:${ original.line ?? '?' })`;
	}
}
