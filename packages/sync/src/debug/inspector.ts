/**
 * The sync wire inspector: opt-in console tooling for the polling
 * transport's request/response stream.
 *
 * The Network tab is hostile to this traffic — every poll looks identical,
 * the interesting one scrolls away, and update payloads are JSON strings
 * nested inside JSON. The transport is a single choke point, so one tap
 * (recordPoll, called by the polling manager) feeds a ring buffer of
 * DECODED traffic that the console can tail live or query after the fact.
 *
 * Usage (browser console):
 *
 *     wpSync.enable()            // persists in localStorage; wpSync.disable()
 *     wpSync.tail()              // live-print non-empty polls; wpSync.untail()
 *     wpSync.log()               // recent poll records (decoded)
 *     wpSync.table()             // console.table of individual rows
 *     wpSync.intents( 'p1' )     // everything that touched one syncId
 *     wpSync.doc()               // current engine document (intent-log)
 *     wpSync.proposals()         // open review list (intent-log)
 *     wpSync.export()            // JSON dump for bug reports
 *
 * The stub (enable/disable/help) is always installed; everything else is
 * inert until enabled — the transport's fast path stays a boolean check.
 * Works for any engine: intent-log rows decode fully; opaque payloads
 * (Yjs binary) fall back to type + size.
 */

const STORAGE_KEY = 'wp_sync_debug';
const BUFFER_LIMIT = 500;

interface WireUpdate {
	data: string;
	type: string;
}

interface DecodedRow {
	direction: 'sent' | 'received';
	type: string;
	summary: string;
	detail: unknown;
}

export interface PollRecord {
	id: number;
	time: string;
	room: string;
	durationMs?: number;
	cursorBefore?: number;
	cursorAfter?: number;
	rows: DecodedRow[];
	dispositions: Array< Record< string, unknown > >;
	serverDebug?: Record< string, unknown >;
	error?: string;
}

/**
 * Duck-typed session surface for state accessors: engines with these
 * methods (the intent log) expose live state; others simply return
 * undefined. Accepts any session codec.
 */
type DebugSession = object & {
	getDocument?: () => unknown;
	getOpenProposals?: () => unknown[];
	getSeq?: () => number;
};

let pollCounter = 0;
const buffer: PollRecord[] = [];
const sessions = new Map< string, DebugSession >();
let tailing = false;

/**
 * Whether the inspector is enabled (persisted per browser profile).
 *
 * @return Enabled state.
 */
export function isSyncDebugEnabled(): boolean {
	try {
		return '1' === window.localStorage.getItem( STORAGE_KEY );
	} catch {
		return false;
	}
}

/**
 * One-line human form of an intent payload — the decoding that makes the
 * tail readable ('insert_text p1.content @5 +" world"' instead of nested
 * JSON strings).
 *
 * @param type    Intent type.
 * @param payload Intent payload.
 * @return Compact summary.
 */
function summarizeIntentPayload(
	type: string,
	payload: Record< string, unknown >
): string {
	const target = `${ payload.syncId ?? '' }${
		payload.field ? `.${ payload.field }` : ''
	}`;
	switch ( type ) {
		case 'insert_text':
			return `${ target } @${ payload.offset } +${ JSON.stringify(
				payload.text
			) }`;
		case 'delete_text':
			return `${ target } -[${ payload.start },${
				payload.end
			}) ${ JSON.stringify( payload.removedText ) }`;
		case 'replace_text':
			return `${ target } [${ payload.start },${
				payload.end
			}) ${ JSON.stringify( payload.removedText ) }→${ JSON.stringify(
				payload.text
			) }`;
		case 'format_text':
			return `${ target } [${ payload.start },${ payload.end }) ${
				payload.format
			} ${ payload.on ? 'on' : 'off' }`;
		case 'set_attr':
			return `${ payload.syncId } ${ payload.key }=${ JSON.stringify(
				payload.value
			) } (v${ payload.observedVersion })`;
		case 'remove_attr':
			return `${ payload.syncId } -${ payload.key }`;
		case 'set_property':
			return `${ payload.name }=${ JSON.stringify( payload.value ) } (v${
				payload.observedVersion
			})`;
		case 'insert_block': {
			const block = payload.block as
				| { syncId?: string; blockType?: string }
				| undefined;
			return `+${ block?.syncId } (${ block?.blockType }) after ${ payload.afterSiblingId }`;
		}
		case 'remove_block':
			return `-${ payload.syncId }`;
		case 'move_block':
			return `${ payload.syncId } → parent ${ payload.newParentId } after ${ payload.afterSiblingId }`;
		case 'split_block':
			return `${ target } @${ payload.offset } → ${ payload.newSyncId }`;
		case 'merge_blocks':
			return `${ payload.absorbedId } → ${ payload.survivorId }.${ payload.field } @${ payload.joinOffset }`;
		case 'transform_block':
			return `${ payload.syncId } → ${ payload.newBlockType }`;
		case 'replace_attr_content':
			return `${ target } := ${ JSON.stringify( payload.newText ) }`;
		default:
			return JSON.stringify( payload );
	}
}

/**
 * Decodes one wire update row into a summary + parsed detail. Opaque
 * payloads (e.g. Yjs binary) fall back to type + size.
 *
 * @param update    Wire update.
 * @param direction sent | received.
 * @return Decoded row.
 */
function decodeUpdate(
	update: WireUpdate,
	direction: DecodedRow[ 'direction' ]
): DecodedRow {
	let decoded: Record< string, unknown > | null = null;
	try {
		const parsed: unknown = JSON.parse( update.data );
		if ( parsed && 'object' === typeof parsed ) {
			decoded = parsed as Record< string, unknown >;
		}
	} catch {
		decoded = null;
	}
	if ( ! decoded ) {
		return {
			direction,
			type: update.type,
			summary: `${ update.type } (${ update.data.length }b)`,
			detail: update.data.length > 120 ? undefined : update.data,
		};
	}
	let summary = update.type;
	if ( 'intent' === update.type && 'string' === typeof decoded.type ) {
		summary = `${ decoded.type } ${ summarizeIntentPayload(
			decoded.type,
			( decoded.payload as Record< string, unknown > ) ?? {}
		) } (${ decoded.actorId }#${ String( decoded.intentId ).slice(
			0,
			12
		) } @${ decoded.baseSeq })`;
	} else if ( 'proposal' === update.type ) {
		const intent = decoded.intent as
			| { type?: string; intentId?: string }
			| undefined;
		summary = `proposal ${ intent?.type } ${ intent?.intentId } (${ decoded.reason }, by ${ decoded.actorId })`;
	} else if ( 'resolved' === update.type ) {
		summary = `resolved ${ decoded.proposalId } ${ decoded.resolution }${
			decoded.resolvedBy ? ` by ${ decoded.resolvedBy }` : ''
		}`;
	} else if ( 'snapshot' === update.type ) {
		const doc = decoded.doc as { root?: unknown[] } | undefined;
		summary = `snapshot seq ${ decoded.seq ?? 0 }, ${
			doc?.root?.length ?? 0
		} root blocks${ decoded.checkpoint ? ' (checkpoint)' : '' }`;
	} else if ( 'voided' === update.type ) {
		summary = `voided ${ decoded.intentId } (${ decoded.reason })`;
	}
	return { direction, type: update.type, summary, detail: decoded };
}

/**
 * Prints one poll record as a collapsed console group.
 *
 * @param record Poll record.
 */
function printPoll( record: PollRecord ): void {
	const sent = record.rows.filter( ( row ) => 'sent' === row.direction );
	const received = record.rows.filter(
		( row ) => 'received' === row.direction
	);
	const cursor =
		undefined !== record.cursorBefore &&
		record.cursorAfter !== record.cursorBefore
			? `, cursor ${ record.cursorBefore }→${ record.cursorAfter }`
			: '';
	const timing =
		undefined === record.durationMs
			? ''
			: `, ${ Math.round( record.durationMs ) }ms`;
	const label = `sync ⇅ #${ record.id } ${ record.room }  sent ${
		sent.length
	} → recv ${ received.length } rows + ${
		record.dispositions.length
	} acks${ cursor }${ timing }${
		record.error ? `  ✗ ${ record.error }` : ''
	}`;
	/* eslint-disable no-console */
	console.groupCollapsed( label );
	for ( const row of record.rows ) {
		console.log(
			`${ 'sent' === row.direction ? '→' : '←' } ${ row.summary }`,
			row.detail ?? ''
		);
	}
	for ( const ack of record.dispositions ) {
		console.log(
			`✓ ack ${ ack.intentId } ${ ack.status }${
				ack.reason ? ` (${ ack.reason })` : ''
			}`
		);
	}
	if ( record.serverDebug ) {
		console.log( '⚙ server', record.serverDebug );
	}
	console.groupEnd();
	/* eslint-enable no-console */
}

interface PollEntry {
	room: string;
	sent: WireUpdate[];
	received: WireUpdate[];
	dispositions?: Array< Record< string, unknown > >;
	cursorBefore?: number;
	cursorAfter?: number;
	durationMs?: number;
	serverDebug?: Record< string, unknown >;
	error?: string;
}

/**
 * Records one poll's decoded traffic (called by the polling manager per
 * room, only when the inspector is enabled).
 *
 * @param entry Poll data.
 */
export function recordPoll( entry: PollEntry ): void {
	const rows = [
		...entry.sent.map( ( update ) => decodeUpdate( update, 'sent' ) ),
		...entry.received.map( ( update ) =>
			decodeUpdate( update, 'received' )
		),
	];
	// Empty polls are the stream's noise floor: not buffered, not printed.
	if (
		0 === rows.length &&
		0 === ( entry.dispositions?.length ?? 0 ) &&
		! entry.error
	) {
		return;
	}
	const record: PollRecord = {
		id: ++pollCounter,
		time: new Date().toISOString(),
		room: entry.room,
		durationMs: entry.durationMs,
		cursorBefore: entry.cursorBefore,
		cursorAfter: entry.cursorAfter,
		rows,
		dispositions: entry.dispositions ?? [],
		serverDebug: entry.serverDebug,
		error: entry.error,
	};
	buffer.push( record );
	if ( buffer.length > BUFFER_LIMIT ) {
		buffer.shift();
	}
	if ( tailing ) {
		printPoll( record );
	}
}

/**
 * Registers a room's session codec so state accessors (doc, proposals)
 * work. Duck-typed: engines without the surface simply return undefined.
 *
 * @param room    Room identifier.
 * @param session Session codec.
 */
export function registerDebugSession(
	room: string,
	session: DebugSession
): void {
	sessions.set( room, session );
}

/**
 * Unregisters a room's session.
 *
 * @param room Room identifier.
 */
export function unregisterDebugSession( room: string ): void {
	sessions.delete( room );
}

function pickSession( room?: string ): DebugSession | undefined {
	if ( room ) {
		return sessions.get( room );
	}
	// Prefer the (usually sole) entity room over collection rooms.
	const entries = [ ...sessions.entries() ];
	const entity = entries.find( ( [ name ] ) => name.includes( ':' ) );
	return ( entity ?? entries[ 0 ] )?.[ 1 ];
}

interface LogFilter {
	room?: string;
	type?: string;
	actor?: string;
	since?: number;
}

function filteredRecords( filter: LogFilter = {} ): PollRecord[] {
	return buffer.filter( ( record ) => {
		if ( filter.room && record.room !== filter.room ) {
			return false;
		}
		if ( filter.since && record.id < filter.since ) {
			return false;
		}
		if ( filter.type || filter.actor ) {
			return record.rows.some( ( row ) => {
				const detail = row.detail as
					| Record< string, unknown >
					| undefined;
				if (
					filter.type &&
					row.type !== filter.type &&
					detail?.type !== filter.type
				) {
					return false;
				}
				if ( filter.actor && detail?.actorId !== filter.actor ) {
					return false;
				}
				return true;
			} );
		}
		return true;
	} );
}

/**
 * The console-facing API. Installed at window.wpSync as a stub always;
 * fully active once enabled.
 */
export const syncDebugApi = {
	enable(): string {
		try {
			window.localStorage.setItem( STORAGE_KEY, '1' );
		} catch {
			return 'localStorage unavailable';
		}
		tailing = true;
		return 'Sync inspector enabled (tailing). wpSync.help() for commands.';
	},
	disable(): string {
		try {
			window.localStorage.removeItem( STORAGE_KEY );
		} catch {}
		tailing = false;
		return 'Sync inspector disabled.';
	},
	tail(): string {
		tailing = true;
		return 'Tailing non-empty polls. wpSync.untail() to stop.';
	},
	untail(): string {
		tailing = false;
		return 'Tail stopped.';
	},
	log( filter: LogFilter = {} ): PollRecord[] {
		return filteredRecords( filter );
	},
	table( filter: LogFilter = {} ): void {
		const rows: Array< Record< string, unknown > > = [];
		for ( const record of filteredRecords( filter ) ) {
			for ( const row of record.rows ) {
				rows.push( {
					poll: record.id,
					dir: 'sent' === row.direction ? '→' : '←',
					summary: row.summary,
				} );
			}
		}
		// eslint-disable-next-line no-console
		console.table( rows );
	},
	intents( syncId: string ): PollRecord[] {
		return buffer
			.map( ( record ) => ( {
				...record,
				rows: record.rows.filter( ( row ) =>
					JSON.stringify(
						( row.detail as { payload?: unknown } )?.payload ?? ''
					).includes( syncId )
				),
			} ) )
			.filter( ( record ) => record.rows.length > 0 );
	},
	doc( room?: string ): unknown {
		return pickSession( room )?.getDocument?.();
	},
	proposals( room?: string ): unknown[] | undefined {
		return pickSession( room )?.getOpenProposals?.();
	},
	cursor( room?: string ): number | undefined {
		return pickSession( room )?.getSeq?.();
	},
	export(): string {
		return JSON.stringify(
			{ exportedAt: new Date().toISOString(), polls: buffer },
			null,
			'\t'
		);
	},
	clear(): void {
		buffer.length = 0;
	},
	help(): string {
		return [
			'wpSync.tail() / untail()    live-print non-empty polls',
			'wpSync.log({room,type,actor,since})   recent poll records',
			'wpSync.table()              flat console.table of rows',
			"wpSync.intents('p1')        history touching one syncId",
			'wpSync.doc() / proposals() / cursor()   session state',
			'wpSync.export() / clear()   dump or reset the buffer',
			'wpSync.disable()            turn the inspector off',
		].join( '\n' );
	},
};

/**
 * Installs the console stub (idempotent). Full API is the same object —
 * recording simply stays inert until enabled.
 */
export function installSyncDebug(): void {
	const host = window as unknown as { wpSync?: typeof syncDebugApi };
	if ( ! host.wpSync ) {
		host.wpSync = syncDebugApi;
	}
	if ( isSyncDebugEnabled() ) {
		tailing = true;
	}
}
