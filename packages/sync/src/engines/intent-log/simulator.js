/**
 * Deterministic simulation harness. See SPEC.md ("Validation oracles").
 *
 * The whole system — N clients, the server, disconnections, reconnect
 * catch-up — runs in-process from a seeded PRNG. "Offline for hours" is just
 * a schedule in which a client accumulates many intents between syncs;
 * divergence depth, not wall-clock time, is the stressor. Every run is
 * exactly reproducible from its seed.
 *
 * Clients are REAL replicas (src/client.js): they apply their intents
 * optimistically, rebase pending work over received entries, and predict the
 * server's disposition for everything they flush. The oracles compare those
 * predictions and the optimistic documents against the server's ground
 * truth, so convergence is checked across independently computed states, not
 * against a replay of the same log by the same code path.
 *
 * No wall clocks and no ambient randomness anywhere in the simulated path:
 * intentIds, txnIds and minted syncIds all derive from the seed.
 */

import {
	allSyncIds,
	canonicalJson,
	createDocument,
	getBlock,
	locateBlock,
} from './document.js';
import { IntentTypes, createIntent } from './intents.js';
import {
	ESCALATION_REASONS,
	createServer,
	serverDocAt,
	serverIngestBatch,
} from './rebase.js';
import { authorIntent, catchUp, createClient, flushClient } from './client.js';
import { genesisSyncId, mintSyncId } from './sync-id.js';

/**
 * Small, high-quality seeded PRNG (mulberry32).
 *
 * @param {number} seed Seed.
 * @return {() => number} RNG returning [0, 1).
 */
export function mulberry32( seed ) {
	/* eslint-disable no-bitwise -- Bitwise math is the PRNG algorithm. */
	let state = seed >>> 0;
	return () => {
		state = ( state + 0x6d2b79f5 ) >>> 0;
		let t = state;
		t = Math.imul( t ^ ( t >>> 15 ), t | 1 );
		t ^= t + Math.imul( t ^ ( t >>> 7 ), t | 61 );
		return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296;
	};
	/* eslint-enable no-bitwise */
}

/*
 * Includes multibyte BMP content (é is 2 UTF-8 bytes / 1 UTF-16 code unit;
 * CJK is 3 bytes / 1 unit) so the frozen vectors pin the UTF-16 code-unit
 * coordinate space cross-language — a byte-offset PHP twin fails these.
 * Astral characters (surrogate pairs) are deliberately excluded: splitting
 * inside a pair is a documented open edge (SPEC.md), not yet pinned.
 */
const WORDS = [
	'lorem',
	'ipsum',
	'dolor',
	'café',
	'niño',
	'你好世界',
	'blöck',
];
const FORMATS = [ 'bold', 'em', 'code' ];
const ATTR_KEYS = [ 'align', 'dropCap', 'fontSize' ];

const pick = ( rng, list ) => list[ Math.floor( rng() * list.length ) ];
const randInt = ( rng, maxExclusive ) => Math.floor( rng() * maxExclusive );

/**
 * A "legacy post" genesis document: block identity minted deterministically
 * from the revision descriptor, exactly as independent clients would.
 *
 * @param {Object} revision { postId, revisionId }.
 * @return {Object} Document.
 */
export function makeGenesisDoc( revision ) {
	const id = ( path ) => genesisSyncId( revision, path );
	return createDocument( [
		{
			syncId: id( [ 0 ] ),
			blockType: 'core/paragraph',
			text: 'It was a dark and stormy night.',
		},
		{
			// Multi-field block: quote content plus citation, so schedules
			// exercise field-scoped conflict granularity.
			syncId: id( [ 1 ] ),
			blockType: 'core/quote',
			fields: {
				content: { text: 'The rain fell in torrents.' },
				citation: { text: 'Bulwer-Lytton' },
			},
		},
		{
			syncId: id( [ 2 ] ),
			blockType: 'core/group',
			children: [
				{
					syncId: id( [ 2, 0 ] ),
					blockType: 'core/paragraph',
					text: 'Except at occasional intervals.',
				},
				{
					syncId: id( [ 2, 1 ] ),
					blockType: 'core/paragraph',
					text: 'When it was checked by a violent gust.',
				},
			],
		},
		{
			syncId: id( [ 3 ] ),
			blockType: 'core/paragraph',
			text: 'Which swept up the streets.',
		},
	] );
}

/**
 * Creates a virtual client (a real replica; see src/client.js).
 *
 * @param {string} actorId    Actor id.
 * @param {Object} initialDoc Genesis document.
 * @return {Object} Client state.
 */
export function makeClient( actorId, initialDoc ) {
	return createClient( actorId, initialDoc );
}

function envelopeFor( client, extra = {} ) {
	return {
		actorId: client.actorId,
		baseSeq: client.cursor,
		intentId: `${ client.actorId }#${ client.nextIntent++ }`,
		...extra,
	};
}

const PROPERTY_NAMES = [ 'title', 'excerpt' ];

/**
 * Authors one pseudo-random intent (occasionally an atomic pair) against the
 * client's local view, applies it optimistically, and queues it.
 *
 * Covers the full vocabulary so the randomized sweeps exercise every merge
 * combination the matrix tests enumerate pairwise. Entity property ops are
 * opt-in: enabling them consumes extra RNG draws, so the frozen vector
 * seeds (generated without them) stay byte-identical.
 *
 * @param {Object}       client                Client.
 * @param {() => number} rng                   Seeded RNG.
 * @param {Object}       [options]             Options.
 * @param {boolean}      [options.propertyOps] Author set_property intents.
 * @return {Object[]} The authored intents (empty if the document is empty).
 */
export function authorRandomIntent( client, rng, options = {} ) {
	if ( options.propertyOps && rng() < 0.1 ) {
		const name = pick( rng, PROPERTY_NAMES );
		const propertyIntent = createIntent(
			IntentTypes.SET_PROPERTY,
			{
				name,
				value: pick( rng, WORDS ),
				observedVersion: client.doc.propVersions?.[ name ] ?? 0,
			},
			envelopeFor( client )
		);
		authorIntent( client, propertyIntent );
		return [ propertyIntent ];
	}
	const ids = allSyncIds( client.doc );
	if ( ids.length === 0 ) {
		return [];
	}
	const syncId = pick( rng, ids );
	const block = getBlock( client.doc, syncId );
	const field = pick( rng, Object.keys( block.fields ) );
	const fieldText = block.fields[ field ].text;
	const textLength = fieldText.length;
	const roll = rng();
	let intent = null;

	if ( roll < 0.24 ) {
		intent = createIntent(
			IntentTypes.INSERT_TEXT,
			{
				syncId,
				field,
				offset: randInt( rng, textLength + 1 ),
				text: ` ${ pick( rng, WORDS ) }`,
			},
			envelopeFor( client )
		);
	} else if ( roll < 0.35 && textLength >= 4 ) {
		const start = randInt( rng, textLength - 2 );
		const end =
			start + 1 + randInt( rng, Math.min( 5, textLength - start - 1 ) );
		intent = createIntent(
			IntentTypes.DELETE_TEXT,
			{
				syncId,
				field,
				start,
				end,
				removedText: fieldText.slice( start, end ),
			},
			envelopeFor( client )
		);
	} else if ( roll < 0.41 && textLength >= 4 ) {
		const start = randInt( rng, textLength - 2 );
		const end =
			start + 1 + randInt( rng, Math.min( 4, textLength - start - 1 ) );
		intent = createIntent(
			IntentTypes.REPLACE_TEXT,
			{
				syncId,
				field,
				start,
				end,
				removedText: fieldText.slice( start, end ),
				text: pick( rng, WORDS ),
			},
			envelopeFor( client )
		);
	} else if ( roll < 0.49 && textLength >= 4 ) {
		const start = randInt( rng, textLength - 2 );
		intent = createIntent(
			IntentTypes.FORMAT_TEXT,
			{
				syncId,
				field,
				start,
				end: start + 1 + randInt( rng, textLength - start - 1 ),
				format: pick( rng, FORMATS ),
				on: rng() < 0.8,
			},
			envelopeFor( client )
		);
	} else if ( roll < 0.57 ) {
		const key = pick( rng, ATTR_KEYS );
		intent = createIntent(
			IntentTypes.SET_ATTR,
			{
				syncId,
				key,
				value: pick( rng, [ 'wide', 'full', true, 'large' ] ),
				observedVersion: block.attrVersions[ key ] ?? 0,
			},
			envelopeFor( client )
		);
	} else if ( roll < 0.61 ) {
		const key = pick( rng, ATTR_KEYS );
		intent = createIntent(
			IntentTypes.REMOVE_ATTR,
			{
				syncId,
				key,
				observedVersion: block.attrVersions[ key ] ?? 0,
			},
			envelopeFor( client )
		);
	} else if ( roll < 0.69 ) {
		intent = createIntent(
			IntentTypes.INSERT_BLOCK,
			{
				block: {
					syncId: mintSyncId( rng ),
					blockType: 'core/paragraph',
				},
				parentId: null,
				afterSiblingId: pick( rng, [ null, syncId ] ),
			},
			envelopeFor( client )
		);
	} else if ( roll < 0.75 && textLength >= 2 ) {
		intent = createIntent(
			IntentTypes.SPLIT_BLOCK,
			{
				syncId,
				field,
				offset: 1 + randInt( rng, textLength - 1 ),
				newSyncId: mintSyncId( rng ),
			},
			envelopeFor( client )
		);
	} else if ( roll < 0.79 ) {
		const location = locateBlock( client.doc, syncId );
		const nextSibling = location.siblings[ location.index + 1 ];
		if ( nextSibling && nextSibling.children.length === 0 ) {
			intent = createIntent(
				IntentTypes.MERGE_BLOCKS,
				{
					survivorId: syncId,
					absorbedId: nextSibling.syncId,
					field,
					joinOffset: textLength,
				},
				envelopeFor( client )
			);
		}
	} else if ( roll < 0.84 ) {
		intent = createIntent(
			IntentTypes.TRANSFORM_BLOCK,
			{
				syncId,
				newBlockType:
					block.blockType === 'core/paragraph'
						? 'core/heading'
						: 'core/paragraph',
			},
			envelopeFor( client )
		);
	} else if ( roll < 0.9 ) {
		intent = createIntent(
			IntentTypes.MOVE_BLOCK,
			{
				syncId,
				newParentId: null,
				afterSiblingId: pick( rng, [
					null,
					...ids.filter( ( id ) => id !== syncId ),
				] ),
			},
			envelopeFor( client )
		);
	} else if ( roll < 0.94 ) {
		intent = createIntent(
			IntentTypes.REMOVE_BLOCK,
			{ syncId },
			envelopeFor( client )
		);
	} else {
		// Atomic pair across two blocks (rule 4 material): both apply or
		// both escalate.
		const other = pick( rng, [
			syncId,
			...ids.filter( ( id ) => id !== syncId ),
		] );
		const txnId = `txn-${ client.actorId }-${ client.nextIntent }`;
		const first = createIntent(
			IntentTypes.INSERT_TEXT,
			{
				syncId,
				field,
				offset: randInt( rng, textLength + 1 ),
				text: ` ${ pick( rng, WORDS ) }`,
			},
			envelopeFor( client, { txnId } )
		);
		authorIntent( client, first );
		const otherBlock = getBlock( client.doc, other );
		const otherField = pick( rng, Object.keys( otherBlock.fields ) );
		const second = createIntent(
			IntentTypes.INSERT_TEXT,
			{
				syncId: other,
				field: otherField,
				offset: randInt(
					rng,
					otherBlock.fields[ otherField ].text.length + 1
				),
				text: ` ${ pick( rng, WORDS ) }`,
			},
			envelopeFor( client, { txnId } )
		);
		authorIntent( client, second );
		return [ first, second ];
	}

	if ( ! intent ) {
		return [];
	}
	authorIntent( client, intent );
	return [ intent ];
}

/**
 * Full sync cycle: catch up (rebasing pending work), push the outbox, catch
 * up over the accepted entries. Returns the per-intent prediction report.
 *
 * @param {Object} server Server.
 * @param {Object} client Client.
 * @return {Object[]} { intentId, predicted, actual } per flushed intent.
 */
export function syncClient( server, client ) {
	return flushClient( server, client );
}

/**
 * Runs one seeded schedule.
 *
 * @param {Object}  options               Options.
 * @param {number}  options.seed          PRNG seed.
 * @param {number}  [options.steps]       Schedule steps.
 * @param {number}  [options.clientCount] Number of clients.
 * @param {number}  [options.agentChance] Chance per step of a server-agent
 *                                        write (bot/CLI path, authored at
 *                                        head).
 * @param {boolean} [options.propertyOps] Author entity set_property intents
 *                                        (opt-in: changes RNG draws, so the
 *                                        pre-entity vector seeds keep it
 *                                        off).
 * @param {Array}   [options.recorder]    Ingest transcript recorder; every
 *                                        serverIngestBatch call is pushed
 *                                        onto it (vector generation).
 * @return {Object} { server, clients, authored, finalDoc, violations }.
 */
export function runSimulation( {
	seed,
	steps = 200,
	clientCount = 3,
	agentChance = 0.02,
	propertyOps = false,
	recorder = null,
} ) {
	const rng = mulberry32( seed );
	const revision = { postId: 10, revisionId: 100 };
	const initialDoc = makeGenesisDoc( revision );
	const server = createServer( initialDoc );
	if ( recorder ) {
		server.recorder = recorder;
	}
	const clients = Array.from( { length: clientCount }, ( _, i ) =>
		makeClient( `actor-${ i }`, initialDoc )
	);
	const agent = makeClient( 'agent', initialDoc );
	const authored = new Map();
	const violations = [];
	const lastFlush = new Map(); // actorId → { batch, dispositions }.

	const checkPredictions = ( report ) => {
		for ( const row of report ) {
			const predicted = JSON.stringify( row.predicted );
			const actual = JSON.stringify( row.actual );
			if ( predicted !== actual ) {
				violations.push(
					`${ row.intentId }: predicted ${ predicted }, server said ${ actual }`
				);
			}
		}
	};

	const flush = ( client ) => {
		const batch = [ ...client.outbox ];
		const report = syncClient( server, client );
		checkPredictions( report );
		if ( batch.length > 0 ) {
			lastFlush.set( client.actorId, {
				batch,
				dispositions: report.map( ( row ) => row.actual ),
			} );
		}
	};

	for ( let step = 0; step < steps; step++ ) {
		if ( rng() < agentChance ) {
			// Server agents author at head through the same ingest path.
			agent.cursor = server.log.length;
			agent.doc = serverDocAt( server, server.log.length );
			const ids = allSyncIds( agent.doc );
			if ( ids.length > 0 ) {
				const targetId = pick( rng, ids );
				const targetBlock = getBlock( agent.doc, targetId );
				const intent = createIntent(
					IntentTypes.REPLACE_ATTR_CONTENT,
					{
						syncId: targetId,
						field: pick( rng, Object.keys( targetBlock.fields ) ),
						newText: `Rewritten by agent (${ step }).`,
						observedVersion: 0,
					},
					envelopeFor( agent )
				);
				authored.set( intent.intentId, intent );
				serverIngestBatch( server, [ intent ] );
			}
			continue;
		}

		const client = pick( rng, clients );
		const action = rng();
		if ( action < 0.06 ) {
			client.online = ! client.online;
		} else if ( action < 0.16 && client.online ) {
			// Receive without sending: pending work rebases over the pull.
			catchUp( server, client );
		} else if ( action < 0.3 && client.online ) {
			flush( client );
		} else if ( action < 0.34 && lastFlush.has( client.actorId ) ) {
			// At-least-once transport: redeliver the last flushed batch and
			// hold the server to idempotency.
			const { batch, dispositions } = lastFlush.get( client.actorId );
			const logLengthBefore = server.log.length;
			const redelivered = serverIngestBatch( server, batch );
			if ( server.log.length !== logLengthBefore ) {
				violations.push(
					`${ client.actorId }: redelivery grew the log`
				);
			}
			if (
				JSON.stringify( redelivered ) !== JSON.stringify( dispositions )
			) {
				violations.push(
					`${ client.actorId }: redelivery changed dispositions`
				);
			}
		} else {
			for ( const intent of authorRandomIntent( client, rng, {
				propertyOps,
			} ) ) {
				authored.set( intent.intentId, intent );
			}
		}
	}

	// Drain: everyone reconnects and syncs until quiescent.
	for ( const client of clients ) {
		client.online = true;
		flush( client );
	}
	for ( const client of clients ) {
		catchUp( server, client );
	}

	const finalDoc = serverDocAt( server, server.log.length );
	violations.push( ...checkOracles( server, clients, authored, finalDoc ) );
	return { server, clients, authored, finalDoc, violations };
}

const spliced = ( text, start, end, inserted ) =>
	text.slice( 0, start ) + inserted + text.slice( end );

/**
 * Mechanical intention check for one applied log entry: the documented
 * effect of its (transformed) payload must be visible in the document at its
 * log position. This is the "applied (effect verifiable)" half of the
 * accounting oracle.
 *
 * @param {Object} before Document before the entry.
 * @param {Object} after  Document after the entry.
 * @param {Object} entry  Applied log entry.
 * @return {string|null} A violation description, or null.
 */
export function verifyEffect( before, after, entry ) {
	const { type, payload } = entry;
	const fail = ( what ) => `${ entry.intentId } (${ type }): ${ what }`;
	const blockBefore = ( id ) => getBlock( before, id );
	const blockAfter = ( id ) => getBlock( after, id );
	const emptyField = { text: '', formats: [] };
	const fieldOf = ( block ) => block?.fields[ payload.field ] ?? emptyField;

	switch ( type ) {
		case IntentTypes.SET_ATTR: {
			const block = blockAfter( payload.syncId );
			if (
				! block ||
				JSON.stringify( block.attrs[ payload.key ] ) !==
					JSON.stringify( payload.value )
			) {
				return fail( 'attribute value not set' );
			}
			return null;
		}
		case IntentTypes.SET_PROPERTY: {
			if (
				JSON.stringify( after.props?.[ payload.name ] ) !==
				JSON.stringify( payload.value )
			) {
				return fail( 'property value not set' );
			}
			if (
				( after.propVersions?.[ payload.name ] ?? 0 ) !==
				( before.propVersions?.[ payload.name ] ?? 0 ) + 1
			) {
				return fail( 'property version not bumped' );
			}
			return null;
		}
		case IntentTypes.REMOVE_ATTR: {
			const block = blockAfter( payload.syncId );
			if ( ! block || payload.key in block.attrs ) {
				return fail( 'attribute still present' );
			}
			return null;
		}
		case IntentTypes.INSERT_BLOCK: {
			const location = locateBlock( after, payload.block.syncId );
			if ( ! location || location.parentId !== payload.parentId ) {
				return fail( 'inserted block missing or misparented' );
			}
			return null;
		}
		case IntentTypes.REMOVE_BLOCK: {
			if ( blockAfter( payload.syncId ) ) {
				return fail( 'removed block still present' );
			}
			return null;
		}
		case IntentTypes.MOVE_BLOCK: {
			const location = locateBlock( after, payload.syncId );
			if ( ! location || location.parentId !== payload.newParentId ) {
				return fail( 'moved block missing or misparented' );
			}
			return null;
		}
		case IntentTypes.SPLIT_BLOCK: {
			const sourceField = fieldOf( blockBefore( payload.syncId ) );
			const head = blockAfter( payload.syncId );
			const tail = blockAfter( payload.newSyncId );
			if ( ! head || ! tail ) {
				return fail( 'split halves missing' );
			}
			const offset = Math.min( payload.offset, sourceField.text.length );
			if (
				fieldOf( head ).text !== sourceField.text.slice( 0, offset ) ||
				fieldOf( tail ).text !== sourceField.text.slice( offset )
			) {
				return fail( 'split halves do not partition the field text' );
			}
			// The head keeps its other fields whole.
			const sourceBlock = blockBefore( payload.syncId );
			for ( const [ name, sourceOther ] of Object.entries(
				sourceBlock.fields
			) ) {
				if ( name === payload.field ) {
					continue;
				}
				if ( head.fields[ name ]?.text !== sourceOther.text ) {
					return fail(
						`split disturbed unrelated field "${ name }"`
					);
				}
			}
			return null;
		}
		case IntentTypes.MERGE_BLOCKS: {
			const survivorFieldBefore = fieldOf(
				blockBefore( payload.survivorId )
			);
			const absorbedFieldBefore = fieldOf(
				blockBefore( payload.absorbedId )
			);
			const survivor = blockAfter( payload.survivorId );
			if (
				! survivor ||
				blockAfter( payload.absorbedId ) ||
				fieldOf( survivor ).text !==
					survivorFieldBefore.text + absorbedFieldBefore.text
			) {
				return fail( 'merge did not concatenate the field exactly' );
			}
			return null;
		}
		case IntentTypes.TRANSFORM_BLOCK: {
			const block = blockAfter( payload.syncId );
			if ( ! block || block.blockType !== payload.newBlockType ) {
				return fail( 'block type not transformed' );
			}
			return null;
		}
		case IntentTypes.INSERT_TEXT: {
			const source = fieldOf( blockBefore( payload.syncId ) );
			const field = fieldOf( blockAfter( payload.syncId ) );
			const offset = Math.min( payload.offset, source.text.length );
			if (
				field.text !==
				spliced( source.text, offset, offset, payload.text )
			) {
				return fail( 'inserted text not at its offset' );
			}
			return null;
		}
		case IntentTypes.DELETE_TEXT: {
			const source = fieldOf( blockBefore( payload.syncId ) );
			const field = fieldOf( blockAfter( payload.syncId ) );
			const start = Math.min( payload.start, source.text.length );
			const end = Math.min( payload.end, source.text.length );
			if ( field.text !== spliced( source.text, start, end, '' ) ) {
				return fail( 'deleted range not removed' );
			}
			return null;
		}
		case IntentTypes.FORMAT_TEXT: {
			const source = fieldOf( blockBefore( payload.syncId ) );
			const field = fieldOf( blockAfter( payload.syncId ) );
			const start = Math.min( payload.start, source.text.length );
			const end = Math.min( payload.end, source.text.length );
			if ( payload.on ) {
				const present = field.formats.some(
					( span ) =>
						span.start === start &&
						span.end === end &&
						span.format === payload.format
				);
				return present ? null : fail( 'format span not applied' );
			}
			const lingering = field.formats.some(
				( span ) =>
					span.format === payload.format &&
					span.start < end &&
					span.end > start
			);
			return lingering ? fail( 'format not removed from range' ) : null;
		}
		case IntentTypes.REPLACE_TEXT: {
			const source = fieldOf( blockBefore( payload.syncId ) );
			const field = fieldOf( blockAfter( payload.syncId ) );
			const start = Math.min( payload.start, source.text.length );
			const end = Math.min( payload.end, source.text.length );
			if (
				field.text !== spliced( source.text, start, end, payload.text )
			) {
				return fail( 'replacement not in place' );
			}
			return null;
		}
		case IntentTypes.REPLACE_ATTR_CONTENT: {
			const block = blockAfter( payload.syncId );
			const field = fieldOf( block );
			if (
				! block ||
				field.text !== payload.newText ||
				field.formats.length !== 0
			) {
				return fail( 'field content not replaced wholesale' );
			}
			return null;
		}
		default:
			return fail( 'unknown intent type in log' );
	}
}

/**
 * The oracles. Empty array = the run upholds every checked property.
 * (Prediction and idempotency are checked inline during the run; this
 * covers the end-state properties.)
 *
 * @param {Object} server   Server.
 * @param {Object} clients  Clients (drained).
 * @param {Map}    authored All authored intents by intentId.
 * @param {Object} finalDoc Fresh replay of the full log.
 * @return {string[]} Violations.
 */
export function checkOracles( server, clients, authored, finalDoc ) {
	const violations = [];
	const finalJson = canonicalJson( finalDoc );

	// Convergence: every drained replica — acked AND optimistic state —
	// equals the fresh replay.
	for ( const client of clients ) {
		if ( client.cursor !== server.log.length ) {
			violations.push( `${ client.actorId }: cursor behind head` );
		}
		if ( canonicalJson( client.baseDoc ) !== finalJson ) {
			violations.push( `${ client.actorId }: acked state diverged` );
		}
		if ( canonicalJson( client.doc ) !== finalJson ) {
			violations.push( `${ client.actorId }: optimistic state diverged` );
		}
	}

	// Intent accounting: every authored intent has a terminal disposition;
	// escalations are present in the proposal lane.
	const proposalIds = new Set(
		server.proposals.map( ( proposal ) => proposal.intent.intentId )
	);
	for ( const [ intentId ] of authored ) {
		const disposition = server.dispositions.get( intentId );
		if ( ! disposition ) {
			violations.push( `${ intentId }: no disposition (work lost)` );
			continue;
		}
		if (
			! [ 'applied', 'voided', 'escalated' ].includes(
				disposition.status
			)
		) {
			violations.push( `${ intentId }: bad status` );
		}
		if (
			disposition.status === 'escalated' &&
			! proposalIds.has( intentId )
		) {
			violations.push( `${ intentId }: escalated but not in proposals` );
		}
		if ( disposition.status === 'voided' && ! disposition.reason ) {
			violations.push( `${ intentId }: voided without reason` );
		}
	}

	// Escalation soundness: every escalation carries a reason from the
	// documented rule set.
	for ( const proposal of server.proposals ) {
		if ( ! ESCALATION_REASONS.has( proposal.reason ) ) {
			violations.push(
				`${ proposal.intent.intentId }: unknown escalation reason "${ proposal.reason }"`
			);
		}
	}

	// Effect verification: every applied log entry's documented effect is
	// visible at its log position ("applied" means verifiably applied).
	for ( let seq = 0; seq < server.log.length; seq++ ) {
		const entry = server.log[ seq ];
		const disposition = server.dispositions.get( entry.intentId );
		if ( disposition?.status !== 'applied' ) {
			continue;
		}
		const problem = verifyEffect(
			serverDocAt( server, seq ),
			serverDocAt( server, seq + 1 ),
			entry
		);
		if ( problem ) {
			violations.push( problem );
		}
	}

	// Attribution: every log entry and proposal carries its author.
	for ( const entry of server.log ) {
		const source = authored.get( entry.intentId );
		if ( ! source || source.actorId !== entry.actorId ) {
			violations.push( `${ entry.intentId }: attribution mismatch` );
		}
	}
	for ( const proposal of server.proposals ) {
		const source = authored.get( proposal.intent.intentId );
		if ( ! source || source.actorId !== proposal.actorId ) {
			violations.push(
				`${ proposal.intent.intentId }: proposal attribution mismatch`
			);
		}
	}

	return violations;
}
