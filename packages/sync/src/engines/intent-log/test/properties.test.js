/**
 * Entity property family: set_property as a per-name register on the
 * document (the entity analog of the block attr map). Conflict semantics
 * mirror rule 3: a concurrent write to the same property escalates; writes
 * to different properties merge clean.
 */

import assert from 'node:assert/strict';

import { canonicalJson, createDocument } from '../document.js';
import { createIntent, IntentTypes } from '../intents.js';
import { applyIntent } from '../reducer.js';
import { createServer, serverDocAt, serverIngestBatch } from '../rebase.js';
import { authorIntent, createClient, flushClient } from '../client.js';

const envelope = ( actorId, baseSeq, extra = {} ) => ( {
	actorId,
	baseSeq,
	...extra,
} );

const setProperty = ( actorId, baseSeq, name, value, observedVersion = 0 ) =>
	createIntent(
		IntentTypes.SET_PROPERTY,
		{ name, value, observedVersion },
		envelope( actorId, baseSeq )
	);

describe( 'entity properties', () => {
	it( 'applies set_property and bumps the per-name version', () => {
		const doc = createDocument( [] );
		const first = applyIntent( doc, setProperty( 'a', 0, 'title', 'One' ) );
		assert.equal( first.disposition.status, 'applied' );
		assert.equal( first.doc.props.title, 'One' );
		assert.equal( first.doc.propVersions.title, 1 );

		const second = applyIntent(
			first.doc,
			setProperty( 'a', 1, 'title', 'Two', 1 )
		);
		assert.equal( second.doc.props.title, 'Two' );
		assert.equal( second.doc.propVersions.title, 2 );
		// The input document is never mutated.
		assert.equal( doc.props, undefined );
	} );

	it( 'genesis documents can carry initial properties', () => {
		const doc = createDocument( [], { title: 'Genesis title' } );
		assert.equal( doc.props.title, 'Genesis title' );
		assert.ok(
			canonicalJson( doc ).includes( '"props"' ),
			'canonical form carries non-empty props'
		);
	} );

	it( 'documents without properties canonicalize exactly as before the entity family', () => {
		const doc = createDocument( [
			{ syncId: 'b1', blockType: 'core/paragraph', text: 'Hello' },
		] );
		const json = canonicalJson( doc );
		assert.ok( ! json.includes( 'props' ) );
		assert.ok( json.startsWith( '{"root":' ) );
	} );

	it( 'concurrent writes to DIFFERENT properties merge clean', () => {
		const server = createServer( createDocument( [] ) );
		const [ d1 ] = serverIngestBatch( server, [
			setProperty( 'a', 0, 'title', 'From A' ),
		] );
		const [ d2 ] = serverIngestBatch( server, [
			setProperty( 'b', 0, 'excerpt', 'From B' ),
		] );
		assert.equal( d1.status, 'applied' );
		assert.equal( d2.status, 'applied' );
		const doc = serverDocAt( server, server.log.length );
		assert.equal( doc.props.title, 'From A' );
		assert.equal( doc.props.excerpt, 'From B' );
	} );

	it( 'a concurrent write to the SAME property escalates (rule 3 analog)', () => {
		const server = createServer( createDocument( [] ) );
		const [ d1 ] = serverIngestBatch( server, [
			setProperty( 'a', 0, 'title', 'From A' ),
		] );
		// b authored at baseSeq 0 — it never saw a's write.
		const [ d2 ] = serverIngestBatch( server, [
			setProperty( 'b', 0, 'title', 'From B' ),
		] );
		assert.equal( d1.status, 'applied' );
		assert.equal( d2.status, 'escalated' );
		assert.equal( d2.reason, 'property-conflict' );
		assert.equal( server.proposals.length, 1 );
		assert.equal( server.proposals[ 0 ].reason, 'property-conflict' );
		// The applied write survives untouched.
		const doc = serverDocAt( server, server.log.length );
		assert.equal( doc.props.title, 'From A' );
		assert.equal( doc.propVersions.title, 1 );
	} );

	it( 'a sequential write (conflict observed) applies clean', () => {
		const server = createServer( createDocument( [] ) );
		serverIngestBatch( server, [
			setProperty( 'a', 0, 'title', 'First' ),
		] );
		// b authored AFTER observing a's write (baseSeq 1, version 1).
		const [ d2 ] = serverIngestBatch( server, [
			setProperty( 'b', 1, 'title', 'Second', 1 ),
		] );
		assert.equal( d2.status, 'applied' );
		const doc = serverDocAt( server, server.log.length );
		assert.equal( doc.props.title, 'Second' );
		assert.equal( doc.propVersions.title, 2 );
	} );

	it( 'property writes never disturb concurrent block edits (and vice versa)', () => {
		const initial = createDocument( [
			{ syncId: 'b1', blockType: 'core/paragraph', text: 'Hello' },
		] );
		const server = createServer( initial );
		const [ d1 ] = serverIngestBatch( server, [
			setProperty( 'a', 0, 'title', 'New title' ),
		] );
		const [ d2 ] = serverIngestBatch( server, [
			createIntent(
				IntentTypes.INSERT_TEXT,
				{ syncId: 'b1', field: 'content', offset: 5, text: ' world' },
				envelope( 'b', 0 )
			),
		] );
		assert.equal( d1.status, 'applied' );
		assert.equal( d2.status, 'applied' );
		const doc = serverDocAt( server, server.log.length );
		assert.equal( doc.props.title, 'New title' );
		assert.equal( doc.root[ 0 ].fields.content.text, 'Hello world' );
	} );

	it( 'client prediction matches the server for property conflicts', () => {
		const initial = createDocument( [] );
		const server = createServer( initial );
		const alice = createClient( 'alice', initial );
		const bob = createClient( 'bob', initial );

		authorIntent(
			alice,
			setProperty( 'alice', 0, 'title', 'Alice title' )
		);
		authorIntent( bob, setProperty( 'bob', 0, 'title', 'Bob title' ) );

		const aliceReport = flushClient( server, alice );
		const bobReport = flushClient( server, bob );
		for ( const row of [ ...aliceReport, ...bobReport ] ) {
			assert.deepEqual(
				row.predicted,
				row.actual,
				`prediction mismatch for ${ row.intentId }`
			);
		}
		// Second writer escalated; first won the register.
		assert.equal( bobReport[ 0 ].actual.status, 'escalated' );
		assert.equal( bobReport[ 0 ].actual.reason, 'property-conflict' );
	} );

	it( 'redelivered property intents are idempotent', () => {
		const server = createServer( createDocument( [] ) );
		const intent = setProperty( 'a', 0, 'title', 'Once' );
		const first = serverIngestBatch( server, [ intent ] );
		const logLength = server.log.length;
		const second = serverIngestBatch( server, [ intent ] );
		assert.equal( server.log.length, logLength );
		assert.deepEqual( first, second );
		const doc = serverDocAt( server, server.log.length );
		assert.equal( doc.propVersions.title, 1 );
	} );
} );
