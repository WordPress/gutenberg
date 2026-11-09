/**
 * Suggestion mode typing with real-time collaboration peers (#73411).
 *
 * Measures what one peer's keystrokes cost every peer, in Editing and in
 * Suggesting mode, on a large post: per-keystroke latency on the typing page,
 * arrival latency on the others, and per-keystroke counts of store changes,
 * Yjs updates, awareness messages, block resets and REST requests.
 *
 * The assertions are on counts, which do not depend on machine speed. Set
 * `RTC_SUGGEST_METRICS_FILE` to append each phase's measurements as a JSON
 * line, `RTC_SUGGEST_PROFILE_DIR` to keep each page's CPU profile per phase,
 * `RTC_SUGGEST_CPU` to change the CPU throttling (default 4), and
 * `RTC_SUGGEST_BLOCKS` to change the post size (default 300 paragraphs).
 *
 * `rtc-only` runs the same phases with the Suggestion mode experiment off, as
 * the collaboration baseline.
 */
import { appendFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { CDPSession, Page } from '@playwright/test';
import type {
	Editor,
	RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';
import { test, expect } from './fixtures';
import type { UserCredentials } from './fixtures/collaboration-utils';

const PROBE_PLUGIN = 'gutenberg-test-plugin-rtc-sync-probe';
const BLOCK_COUNT = Number( process.env.RTC_SUGGEST_BLOCKS || 300 );
const CPU_THROTTLE = Number( process.env.RTC_SUGGEST_CPU || 4 );
const METRICS_FILE = process.env.RTC_SUGGEST_METRICS_FILE;
const PROFILE_DIR = process.env.RTC_SUGGEST_PROFILE_DIR;
const SUGGESTION_EXPERIMENT = 'gutenberg-suggestion-mode';
const KEY_DELAY_MS = 100;
const TYPED_A = 'the quick brown fox jumps over the lazy dog and keeps going ';
const TYPED_B = 'pack my box with five dozen liquor jugs then pack some more ';
const TOKEN_A = 'TargetAlpha';
const TOKEN_B = 'TargetBravo';

const THIRD_USER: UserCredentials = {
	username: 'suggest_rtc_third',
	email: 'suggest_rtc_third@example.com',
	firstName: 'Third',
	lastName: 'Peer',
	password: 'password',
	roles: [ 'editor' ],
};

type Mode = 'rtc-only' | 'editing' | 'suggesting';

interface PageCounters {
	blockEditorChanges: number;
	coreDataChanges: number;
	resets: number;
	resetBlocksSeen: number;
	resetBlocksChanged: number;
	getBlockCalls: number;
	getClientIdsWithDescendantsCalls: number;
	updateBlockAttributes: number;
	autosaveTimers: number;
	keyLatencies: number[];
	keyTimes: number[];
	arrivals: Record< string, Record< number, number > >;
	blockCount: number;
	yjs: {
		local: { updates: number; bytes: number };
		remote: { updates: number; bytes: number };
		awareness: { local: number; remote: number };
	};
	docBytes: number | null;
	busyMs: number;
}

/*
 * Toggles the Suggestion mode experiment without touching the collaboration
 * experiment the fixture manages.
 */
async function setSuggestionExperiment(
	requestUtils: RequestUtils,
	enabled: boolean
) {
	const settings = await requestUtils.rest< {
		'gutenberg-experiments'?: Record< string, boolean >;
	} >( { path: '/wp/v2/settings' } );
	const experiments = { ...( settings[ 'gutenberg-experiments' ] || {} ) };
	if ( enabled ) {
		experiments[ SUGGESTION_EXPERIMENT ] = true;
	} else {
		delete experiments[ SUGGESTION_EXPERIMENT ];
	}
	await requestUtils.rest( {
		path: '/wp/v2/settings',
		method: 'POST',
		data: { 'gutenberg-experiments': experiments },
	} );
}

/*
 * Main-thread time that was not idle, from a CPU profile.
 */
function busyTime( profile: any ) {
	const idle = new Set(
		profile.nodes
			.filter( ( node: any ) => node.callFrame.functionName === '(idle)' )
			.map( ( node: any ) => node.id )
	);
	let busy = 0;
	profile.samples.forEach( ( id: number, index: number ) => {
		if ( ! idle.has( id ) ) {
			busy += profile.timeDeltas[ index ] ?? 0;
		}
	} );
	return busy / 1000;
}

/*
 * Installed once per page. Wraps the stable store objects that every
 * consumer reads through, so the counts include the editor's own reads.
 */
async function installCounters( page: Page ) {
	await page.evaluate(
		( tokens: string[] ) => {
			const w = window as any;
			const { data } = w.wp;
			const blockEditor = data.select( 'core/block-editor' );
			const blockEditorDispatch = data.dispatch( 'core/block-editor' );
			const c: any = {
				blockEditorChanges: 0,
				coreDataChanges: 0,
				resets: 0,
				resetBlocksSeen: 0,
				resetBlocksChanged: 0,
				getBlockCalls: 0,
				getClientIdsWithDescendantsCalls: 0,
				updateBlockAttributes: 0,
				autosaveTimers: 0,
				keyLatencies: [],
				keyTimes: [],
				arrivals: {},
			};
			w.__suggestRtc = c;
			const now = () => performance.timeOrigin + performance.now();

			data.subscribe( () => c.blockEditorChanges++, 'core/block-editor' );
			data.subscribe( () => c.coreDataChanges++, 'core' );

			const wrapSelector = ( name: string, counter: string ) => {
				const original = blockEditor[ name ];
				blockEditor[ name ] = function ( ...args: any[] ) {
					c[ counter ]++;
					return original.apply( this, args );
				};
			};
			wrapSelector( 'getBlock', 'getBlockCalls' );
			wrapSelector(
				'getClientIdsWithDescendants',
				'getClientIdsWithDescendantsCalls'
			);

			// Counted underneath Suggestion mode's own wrapper, which is
			// installed when the intent switches and restores this one.
			const originalReset = blockEditorDispatch.resetBlocks;
			blockEditorDispatch.resetBlocks = ( ...args: any[] ) => {
				const before = new Map();
				for ( const id of blockEditor.getClientIdsWithDescendants() ) {
					before.set( id, blockEditor.getBlockAttributes( id ) );
				}
				const result = originalReset( ...args );
				c.resets++;
				for ( const [ id, attributes ] of before ) {
					if ( ! blockEditor.getBlockName( id ) ) {
						continue;
					}
					c.resetBlocksSeen++;
					if ( blockEditor.getBlockAttributes( id ) !== attributes ) {
						c.resetBlocksChanged++;
					}
				}
				return result;
			};
			const originalUpdate = blockEditorDispatch.updateBlockAttributes;
			blockEditorDispatch.updateBlockAttributes = ( ...args: any[] ) => {
				c.updateBlockAttributes++;
				return originalUpdate( ...args );
			};

			// Suggestion mode's note auto-save debounces each block for
			// 1500 ms; a reschedule is a new timer with that delay.
			const originalSetTimeout = w.setTimeout;
			w.setTimeout = function (
				fn: any,
				delay?: number,
				...rest: any[]
			) {
				if ( delay === 1500 ) {
					c.autosaveTimers++;
				}
				return originalSetTimeout.call( w, fn, delay, ...rest );
			};

			// Arrival time of each character, by the target block's length.
			const idByToken: Record< string, string | null > = {};
			const lastLength: Record< string, number > = {};
			const textOf = ( value: any ) =>
				typeof value?.text === 'string'
					? value.text
					: String( value ?? '' ).replace( /<[^>]*>/g, '' );
			const findBlock = ( token: string ) => {
				const cached = idByToken[ token ];
				if (
					cached &&
					textOf(
						blockEditor.getBlockAttributes( cached )?.content
					).includes( token )
				) {
					return cached;
				}
				for ( const id of blockEditor.getClientIdsWithDescendants() ) {
					if (
						textOf(
							blockEditor.getBlockAttributes( id )?.content
						).includes( token )
					) {
						idByToken[ token ] = id;
						return id;
					}
				}
				idByToken[ token ] = null;
				return null;
			};
			const observe = () => {
				for ( const token of tokens ) {
					const id = findBlock( token );
					if ( ! id ) {
						continue;
					}
					const length = textOf(
						blockEditor.getBlockAttributes( id )?.content
					).length;
					const arrivals = ( c.arrivals[ token ] ??= {} );
					const last = lastLength[ token ] ?? length;
					for ( let l = last + 1; l <= length; l++ ) {
						arrivals[ l ] ??= now();
					}
					lastLength[ token ] = Math.max( last, length );
				}
			};
			c.lengthOf = ( token: string ) => {
				const id = findBlock( token );
				return id
					? textOf( blockEditor.getBlockAttributes( id )?.content )
							.length
					: -1;
			};
			observe();
			data.subscribe( observe, 'core/block-editor' );

			// Keystroke latency: from the key event to the first task after
			// the next frame, which is when the keystroke's work has run.
			const iframe = document.querySelector(
				'iframe[name="editor-canvas"]'
			) as HTMLIFrameElement | null;
			const frameWindow: any = iframe?.contentWindow ?? window;
			frameWindow.document.addEventListener(
				'keydown',
				( event: KeyboardEvent ) => {
					if ( event.key.length !== 1 ) {
						return;
					}
					const start =
						frameWindow.performance.timeOrigin + event.timeStamp;
					c.keyTimes.push( start );
					frameWindow.requestAnimationFrame( () =>
						originalSetTimeout.call( w, () =>
							c.keyLatencies.push( now() - start )
						)
					);
				},
				true
			);
		},
		[ TOKEN_A, TOKEN_B ]
	);
}

async function resetCounters( page: Page ) {
	await page.evaluate( () => {
		const c = ( window as any ).__suggestRtc;
		for ( const key of Object.keys( c ) ) {
			if ( typeof c[ key ] === 'number' ) {
				c[ key ] = 0;
			}
		}
		c.keyLatencies = [];
		c.keyTimes = [];
		c.arrivals = {};
		( window as any ).__rtcSyncProbe?.reset();
	} );
}

async function readCounters( page: Page ): Promise< PageCounters > {
	return page.evaluate( () => {
		const w = window as any;
		const c = w.__suggestRtc;
		const probe = w.__rtcSyncProbe;
		return {
			...JSON.parse( JSON.stringify( c ) ),
			blockCount: w.wp.data
				.select( 'core/block-editor' )
				.getClientIdsWithDescendants().length,
			yjs: {
				local: { ...probe.local },
				remote: { ...probe.remote },
				awareness: { ...probe.awareness },
			},
			docBytes: probe.docBytes(),
		};
	} );
}

async function switchIntent( page: Page, intentLabel: string ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Options' } )
		.click();
	const menuItem = page.getByRole( 'menuitemradio', {
		name: new RegExp( `^${ intentLabel }` ),
	} );
	await menuItem.waitFor( { state: 'visible', timeout: 10000 } );
	await menuItem.click();
	await page.keyboard.press( 'Escape' );
}

async function focusEndOf( editor: Editor, page: Page, token: string ) {
	await editor.canvas
		.getByRole( 'document', { name: 'Block: Paragraph' } )
		.filter( { hasText: token } )
		.click();
	await page.keyboard.press( 'End' );
}

function paragraph( text: string ) {
	return `<!-- wp:paragraph -->\n<p>${ text }</p>\n<!-- /wp:paragraph -->`;
}

function largePost() {
	const words =
		'Distributed editing keeps every participant in step while each one works on a different part of the same long document without waiting'.split(
			' '
		);
	const blocks: string[] = [];
	for ( let i = 0; i < BLOCK_COUNT; i++ ) {
		if ( i === Math.floor( BLOCK_COUNT / 2 ) ) {
			blocks.push( paragraph( `${ TOKEN_A } starts here.` ) );
		} else if ( i === Math.floor( ( BLOCK_COUNT * 3 ) / 4 ) ) {
			blocks.push( paragraph( `${ TOKEN_B } starts here.` ) );
		} else if ( i % 10 === 0 ) {
			blocks.push(
				`<!-- wp:heading -->\n<h2 class="wp-block-heading">Section ${ i }</h2>\n<!-- /wp:heading -->`
			);
		} else {
			const text = Array.from(
				{ length: 60 },
				( _, j ) => words[ ( i + j ) % words.length ]
			).join( ' ' );
			blocks.push( paragraph( `${ text }.` ) );
		}
	}
	return blocks.join( '\n\n' );
}

function quantile( values: number[], q: number ) {
	if ( ! values.length ) {
		return null;
	}
	const sorted = [ ...values ].sort( ( a, b ) => a - b );
	return sorted[
		Math.min( sorted.length - 1, Math.floor( q * sorted.length ) )
	];
}

/*
 * Arrival latency on `receiver` of the keystrokes `sender` typed into the
 * block holding `token`, matched by the block's length after each key.
 */
function arrivalLatencies(
	sender: PageCounters,
	receiver: PageCounters,
	token: string,
	startLength: number
) {
	const arrivals = receiver.arrivals[ token ] ?? {};
	return sender.keyTimes
		.map( ( sent, index ) => arrivals[ startLength + index + 1 ] - sent )
		.filter( ( latency ) => Number.isFinite( latency ) );
}

const round = ( value: number | null ) =>
	value === null ? null : Math.round( value * 100 ) / 100;

interface PhaseResult {
	scenario: string;
	mode: Mode;
	peers: Record< string, PageCounters >;
	typedBy: Record< string, number >;
	restRequests: Record< string, number >;
	startLengths: Record< string, number >;
	actionMs?: number;
}

function summarize( result: PhaseResult ) {
	const totalTyped = Object.values( result.typedBy ).reduce(
		( sum, n ) => sum + n,
		0
	);
	return Object.entries( result.peers ).map( ( [ peer, counters ] ) => {
		const ownKeys = result.typedBy[ peer ] ?? 0;
		const remoteKeys = totalTyped - ownKeys;
		const perKey = ( value: number ) =>
			totalTyped ? round( value / totalTyped ) : null;
		const perRemoteKey = ( value: number ) =>
			remoteKeys ? round( value / remoteKeys ) : null;
		const arrivals: number[] = [];
		for ( const [ sender, token ] of [
			[ 'A', TOKEN_A ],
			[ 'B', TOKEN_B ],
		] ) {
			if ( sender !== peer && result.typedBy[ sender ] ) {
				arrivals.push(
					...arrivalLatencies(
						result.peers[ sender ],
						counters,
						token,
						result.startLengths[ token ]
					)
				);
			}
		}
		return {
			scenario: result.scenario,
			mode: result.mode,
			peer,
			keystrokes: ownKeys,
			remoteKeystrokes: remoteKeys,
			medianKeyMs: round( quantile( counters.keyLatencies, 0.5 ) ),
			p95KeyMs: round( quantile( counters.keyLatencies, 0.95 ) ),
			keysOver16ms: counters.keyLatencies.filter( ( l ) => l > 16 )
				.length,
			remoteArrivalMedianMs: round( quantile( arrivals, 0.5 ) ),
			blockEditorChangesPerKey: perKey( counters.blockEditorChanges ),
			coreDataChangesPerKey: perKey( counters.coreDataChanges ),
			yjsLocalUpdatesPerOwnKey: ownKeys
				? round( counters.yjs.local.updates / ownKeys )
				: null,
			yjsLocalBytesPerOwnKey: ownKeys
				? round( counters.yjs.local.bytes / ownKeys )
				: null,
			yjsLocalUpdates: counters.yjs.local.updates,
			yjsRemoteUpdates: counters.yjs.remote.updates,
			awarenessLocalPerKey: perKey( counters.yjs.awareness.local ),
			awarenessRemotePerKey: perKey( counters.yjs.awareness.remote ),
			resetsPerRemoteKey: perRemoteKey( counters.resets ),
			resetChangedFraction: counters.resetBlocksSeen
				? round(
						counters.resetBlocksChanged / counters.resetBlocksSeen
					)
				: null,
			getBlockWalksPerRemoteKey: perRemoteKey(
				counters.getBlockCalls / counters.blockCount
			),
			getClientIdsWithDescendantsPerKey: perKey(
				counters.getClientIdsWithDescendantsCalls
			),
			updateBlockAttributes: counters.updateBlockAttributes,
			autosaveTimersPerRemoteKey: perRemoteKey( counters.autosaveTimers ),
			restRequests: result.restRequests[ peer ] ?? 0,
			docBytes: counters.docBytes,
			blockCount: counters.blockCount,
			resets: counters.resets,
			busyMs: round( counters.busyMs ),
			busyMsPerKey: perKey( counters.busyMs ),
			actionMs: result.actionMs ?? null,
		};
	} );
}

type Typist = [ string, Editor, Page, string, string ];

test.describe( 'Collaboration - Suggestion mode typing', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( PROBE_PLUGIN );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await setSuggestionExperiment( requestUtils, false );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( PROBE_PLUGIN );
	} );

	for ( const mode of [ 'rtc-only', 'editing', 'suggesting' ] as Mode[] ) {
		test( `keystrokes stay cheap for every peer (${ mode })`, async ( {
			collaborationUtils,
			requestUtils,
			editor,
			page,
		}, testInfo ) => {
			test.setTimeout( 400_000 );
			await setSuggestionExperiment( requestUtils, mode !== 'rtc-only' );
			await requestUtils.createUser( THIRD_USER );
			const post = await requestUtils.createPost( {
				title: `Suggestion mode RTC typing (${ mode })`,
				content: largePost(),
				status: 'draft',
				date_gmt: new Date().toISOString(),
			} );

			await collaborationUtils.openCollaborativeSession( post.id );
			const { page: page3 } = await collaborationUtils.joinUser(
				post.id,
				THIRD_USER
			);
			await collaborationUtils.waitForMutualDiscovery();
			const { page2, editor2 } = collaborationUtils;
			const pages: Record< string, Page > = {
				A: page,
				B: page2,
				C: page3,
			};

			await expect
				.poll(
					() =>
						page2.evaluate( () =>
							( window as any ).wp.data
								.select( 'core/block-editor' )
								.getBlockCount()
						),
					{ timeout: 30_000 }
				)
				.toBe( BLOCK_COUNT );

			for ( const pg of Object.values( pages ) ) {
				await installCounters( pg );
			}
			if ( mode === 'suggesting' ) {
				await switchIntent( page, 'Suggesting' );
			}

			const restRequests: Record< string, number > = {};
			let counting = false;
			for ( const [ peer, pg ] of Object.entries( pages ) ) {
				pg.on( 'request', ( request ) => {
					const url = request.url();
					if (
						counting &&
						/wp-json|rest_route/.test( url ) &&
						! /wp-sync/.test( url )
					) {
						restRequests[ peer ] =
							( restRequests[ peer ] ?? 0 ) + 1;
					}
				} );
			}

			// The two typing pages run throttled; the third peer stays at
			// full speed as a reference.
			const sessions: Record< string, CDPSession > = {};
			for ( const [ peer, pg ] of Object.entries( pages ) ) {
				const session = await pg.context().newCDPSession( pg );
				await session.send( 'Profiler.enable' );
				if ( peer !== 'C' ) {
					await session.send( 'Emulation.setCPUThrottlingRate', {
						rate: CPU_THROTTLE,
					} );
				}
				sessions[ peer ] = session;
			}

			const results: ReturnType< typeof summarize > = [];
			const runPhase = async (
				scenario: string,
				typists: Typist[],
				action?: () => Promise< number >
			) => {
				for ( const [ , ed, pg, token ] of typists ) {
					await focusEndOf( ed, pg, token );
				}
				const startLengths: Record< string, number > = {};
				for ( const token of [ TOKEN_A, TOKEN_B ] ) {
					startLengths[ token ] = await page.evaluate(
						( t ) => ( window as any ).__suggestRtc.lengthOf( t ),
						token
					);
				}
				for ( const pg of Object.values( pages ) ) {
					await resetCounters( pg );
				}
				for ( const key of Object.keys( restRequests ) ) {
					delete restRequests[ key ];
				}
				for ( const session of Object.values( sessions ) ) {
					await session.send( 'Profiler.start' );
				}
				counting = true;
				let actionMs: number | undefined;
				if ( action ) {
					actionMs = await action();
				}
				await Promise.all(
					typists.map( ( [ , , pg, , text ] ) =>
						pg.keyboard.type( text, { delay: KEY_DELAY_MS } )
					)
				);
				// Every peer has every keystroke.
				for ( const [ , , , token, text ] of typists ) {
					for ( const pg of Object.values( pages ) ) {
						await expect
							.poll(
								() =>
									pg.evaluate(
										( t ) =>
											(
												window as any
											 ).__suggestRtc.lengthOf( t ),
										token
									),
								{ timeout: 60_000 }
							)
							.toBe( startLengths[ token ] + text.length );
					}
				}
				// Let the note auto-save debounce and follow-up syncs land:
				// wait until no peer's stores or document change for a while.
				let previousActivity = '';
				await expect
					.poll(
						async () => {
							const activity = JSON.stringify(
								await Promise.all(
									Object.values( pages ).map( ( pg ) =>
										pg.evaluate( () => {
											const w = window as any;
											return [
												w.__suggestRtc
													.blockEditorChanges,
												w.__suggestRtc.coreDataChanges,
												w.__rtcSyncProbe.local.updates,
												w.__rtcSyncProbe.remote.updates,
											];
										} )
									)
								)
							);
							const isQuiet = activity === previousActivity;
							previousActivity = activity;
							return isQuiet;
						},
						{ intervals: [ 2500 ], timeout: 30_000 }
					)
					.toBe( true );
				counting = false;
				const peers: Record< string, PageCounters > = {};
				for ( const [ peer, pg ] of Object.entries( pages ) ) {
					const { profile } =
						await sessions[ peer ].send( 'Profiler.stop' );
					if ( PROFILE_DIR ) {
						mkdirSync( PROFILE_DIR, { recursive: true } );
						writeFileSync(
							join(
								PROFILE_DIR,
								`${ mode }-${ scenario }-${ peer }.cpuprofile`
							),
							JSON.stringify( profile )
						);
					}
					peers[ peer ] = {
						...( await readCounters( pg ) ),
						busyMs: busyTime( profile ),
					};
				}
				const typedBy: Record< string, number > = {};
				for ( const [ peer, , , , text ] of typists ) {
					typedBy[ peer ] = text.length;
				}
				const summary = summarize( {
					scenario,
					mode,
					peers,
					typedBy,
					restRequests: { ...restRequests },
					startLengths,
					actionMs,
				} );
				results.push( ...summary );
				if ( METRICS_FILE ) {
					for ( const row of summary ) {
						appendFileSync(
							METRICS_FILE,
							JSON.stringify( {
								...row,
								transport:
									process.env
										.GUTENBERG_RTC_TEST_WS_PROVIDER === '1'
										? 'websocket'
										: 'http',
								cpuThrottle:
									row.peer === 'C' ? 1 : CPU_THROTTLE,
								peerCount: Object.keys( pages ).length,
								blocks: BLOCK_COUNT,
								rawKeyLatencies: peers[ row.peer ].keyLatencies,
							} ) + '\n'
						);
					}
				}
				return summary;
			};

			const A: Typist = [ 'A', editor, page, TOKEN_A, TYPED_A ];
			const B: Typist = [ 'B', editor2, page2, TOKEN_B, TYPED_B ];

			const idle = await runPhase( 'A-types-B-idle', [ A ] );
			const both = await runPhase( 'both-type', [ A, B ] );
			let accept: ReturnType< typeof summarize > = [];
			if ( mode === 'suggesting' ) {
				await switchIntent( page2, 'Suggesting' );
				await runPhase( 'both-suggest', [ A, B ] );

				// The admin accepts the collaborator's suggestion while every
				// peer is connected.
				const allNotes = page
					.getByRole( 'region', { name: 'Editor top bar' } )
					.getByRole( 'button', { name: 'All notes', exact: true } );
				if (
					( await allNotes.getAttribute( 'aria-expanded' ) ) !==
					'true'
				) {
					await allNotes.click();
				}
				const collaboratorNotes = page
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByRole( 'treeitem' )
					.filter( { hasText: 'Test Collaborator' } );
				const acceptButton = collaboratorNotes
					.first()
					.getByRole( 'button', { name: 'Accept suggestion' } );
				await acceptButton.waitFor( { timeout: 30_000 } );
				// One run of typing is one suggestion; more notes mean the run
				// was split.
				const collaboratorNoteCount = await collaboratorNotes.count();
				testInfo.annotations.push( {
					type: 'collaborator-suggestion-notes',
					description: String( collaboratorNoteCount ),
				} );
				if ( METRICS_FILE ) {
					appendFileSync(
						METRICS_FILE,
						JSON.stringify( {
							scenario: 'notes',
							mode,
							collaboratorNoteCount,
						} ) + '\n'
					);
				}
				accept = await runPhase( 'accept', [], async () => {
					const start = Date.now();
					await acceptButton.click();
					await page
						.locator( '.components-snackbar-list' )
						.getByText( 'Suggestion applied.' )
						.waitFor();
					return Date.now() - start;
				} );
			}

			await testInfo.attach( 'suggestion-mode-rtc-metrics', {
				body: JSON.stringify( results, null, 2 ),
				contentType: 'application/json',
			} );

			for ( const session of Object.values( sessions ) ) {
				await session.send( 'Emulation.setCPUThrottlingRate', {
					rate: 1,
				} );
			}

			// An idle peer only applies what arrives: it writes nothing back
			// to the shared document in reaction to a remote keystroke.
			for ( const row of idle.filter( ( r ) => r.peer !== 'A' ) ) {
				expect( row.yjsLocalUpdates ).toBeLessThanOrEqual( 2 );
			}
			// While both type, each peer sends about one update per own
			// keystroke, not one per keystroke it receives.
			for ( const row of both.filter( ( r ) => r.peer !== 'C' ) ) {
				expect( row.yjsLocalUpdatesPerOwnKey ).toBeLessThan( 3 );
			}
			// Accepting is one decision: peers converge on it without a
			// write-back storm.
			for ( const row of accept.filter( ( r ) => r.peer !== 'A' ) ) {
				expect( row.yjsLocalUpdates ).toBeLessThanOrEqual( 5 );
			}
		} );
	}
} );
