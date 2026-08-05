import assert from 'node:assert/strict';

import {
	allSyncIds,
	canonicalJson,
	createDocument,
	documentsEqual,
	getBlock,
} from '../document.js';
import { IntentTypes, createIntent } from '../intents.js';
import { applyIntent, replay } from '../reducer.js';

const ENVELOPE = { actorId: 'dana', baseSeq: 0 };

const intent = ( type, payload ) => createIntent( type, payload, ENVELOPE );

const baseDoc = () =>
	createDocument( [
		{ syncId: 'p1', blockType: 'core/paragraph', text: 'Hello world' },
		{
			syncId: 'g1',
			blockType: 'core/group',
			children: [
				{
					syncId: 'p2',
					blockType: 'core/paragraph',
					text: 'Nested',
				},
			],
		},
		{ syncId: 'p3', blockType: 'core/paragraph', text: 'Tail' },
	] );

test( 'applyIntent never mutates its input document', () => {
	const doc = baseDoc();
	const before = canonicalJson( doc );
	applyIntent(
		doc,
		intent( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 5,
			text: '!',
		} )
	);
	applyIntent( doc, intent( IntentTypes.REMOVE_BLOCK, { syncId: 'g1' } ) );
	assert.equal( canonicalJson( doc ), before );
} );

test( 'set_attr bumps the per-key register version', () => {
	let { doc } = applyIntent(
		baseDoc(),
		intent( IntentTypes.SET_ATTR, {
			syncId: 'p1',
			key: 'align',
			value: 'wide',
			observedVersion: 0,
		} )
	);
	assert.equal( getBlock( doc, 'p1' ).attrs.align, 'wide' );
	assert.equal( getBlock( doc, 'p1' ).attrVersions.align, 1 );
	( { doc } = applyIntent(
		doc,
		intent( IntentTypes.REMOVE_ATTR, {
			syncId: 'p1',
			key: 'align',
			observedVersion: 1,
		} )
	) );
	assert.equal( getBlock( doc, 'p1' ).attrs.align, undefined );
	assert.equal( getBlock( doc, 'p1' ).attrVersions.align, 2 );
} );

test( 'insert_block anchors after sibling, at start, and falls back on missing sibling', () => {
	const insert = ( afterSiblingId, syncId ) =>
		intent( IntentTypes.INSERT_BLOCK, {
			block: { syncId, blockType: 'core/paragraph' },
			parentId: null,
			afterSiblingId,
		} );
	let { doc } = applyIntent( baseDoc(), insert( 'p1', 'n1' ) );
	assert.deepEqual(
		doc.root.map( ( b ) => b.syncId ),
		[ 'p1', 'n1', 'g1', 'p3' ]
	);
	( { doc } = applyIntent( doc, insert( null, 'n2' ) ) );
	assert.equal( doc.root[ 0 ].syncId, 'n2' );
	( { doc } = applyIntent( doc, insert( 'ghost', 'n3' ) ) );
	assert.equal( doc.root.at( -1 ).syncId, 'n3' );
} );

test( 'insert_block voids on duplicate id (idempotency backstop)', () => {
	const { disposition } = applyIntent(
		baseDoc(),
		intent( IntentTypes.INSERT_BLOCK, {
			block: { syncId: 'p1', blockType: 'core/paragraph' },
			parentId: null,
			afterSiblingId: null,
		} )
	);
	assert.deepEqual( disposition, {
		status: 'voided',
		reason: 'duplicate-id',
	} );
} );

test( 'remove_block removes the subtree; second removal voids clean', () => {
	const { doc } = applyIntent(
		baseDoc(),
		intent( IntentTypes.REMOVE_BLOCK, { syncId: 'g1' } )
	);
	assert.deepEqual( allSyncIds( doc ), [ 'p1', 'p3' ] );
	const { disposition } = applyIntent(
		doc,
		intent( IntentTypes.REMOVE_BLOCK, { syncId: 'g1' } )
	);
	assert.deepEqual( disposition, {
		status: 'voided',
		reason: 'already-removed',
	} );
} );

test( 'move_block reparents and refuses cycles', () => {
	const { doc } = applyIntent(
		baseDoc(),
		intent( IntentTypes.MOVE_BLOCK, {
			syncId: 'p1',
			newParentId: 'g1',
			afterSiblingId: 'p2',
		} )
	);
	assert.deepEqual(
		getBlock( doc, 'g1' ).children.map( ( b ) => b.syncId ),
		[ 'p2', 'p1' ]
	);
	const { disposition } = applyIntent(
		doc,
		intent( IntentTypes.MOVE_BLOCK, {
			syncId: 'g1',
			newParentId: 'p2',
			afterSiblingId: null,
		} )
	);
	assert.deepEqual( disposition, { status: 'voided', reason: 'cycle' } );
} );

test( 'split_block divides text and formats, stamps syncParent, keeps first-half identity', () => {
	const withFormat = applyIntent(
		baseDoc(),
		intent( IntentTypes.FORMAT_TEXT, {
			syncId: 'p1',
			start: 3,
			end: 8,
			format: 'bold',
			on: true,
		} )
	).doc;
	const { doc } = applyIntent(
		withFormat,
		intent( IntentTypes.SPLIT_BLOCK, {
			syncId: 'p1',
			offset: 5,
			newSyncId: 'p1b',
		} )
	);
	const head = getBlock( doc, 'p1' );
	const tail = getBlock( doc, 'p1b' );
	assert.equal( head.fields.content.text, 'Hello' );
	assert.equal( tail.fields.content.text, ' world' );
	assert.equal( tail.syncParent, 'p1' );
	assert.deepEqual( head.fields.content.formats, [
		{ start: 3, end: 5, format: 'bold' },
	] );
	assert.deepEqual( tail.fields.content.formats, [
		{ start: 0, end: 3, format: 'bold' },
	] );
	assert.deepEqual(
		doc.root.map( ( b ) => b.syncId ),
		[ 'p1', 'p1b', 'g1', 'p3' ]
	);
} );

test( 'merge_blocks joins text/formats/children into the survivor', () => {
	const withFormat = applyIntent(
		baseDoc(),
		intent( IntentTypes.FORMAT_TEXT, {
			syncId: 'p3',
			start: 0,
			end: 4,
			format: 'em',
			on: true,
		} )
	).doc;
	const { doc } = applyIntent(
		withFormat,
		intent( IntentTypes.MERGE_BLOCKS, {
			survivorId: 'p1',
			absorbedId: 'p3',
			joinOffset: 11,
		} )
	);
	const survivor = getBlock( doc, 'p1' );
	assert.equal( survivor.fields.content.text, 'Hello worldTail' );
	assert.deepEqual( survivor.fields.content.formats, [
		{ start: 11, end: 15, format: 'em' },
	] );
	assert.equal( getBlock( doc, 'p3' ), null );
} );

test( 'text intents: insert, delete, format on/off, replace', () => {
	let { doc } = applyIntent(
		baseDoc(),
		intent( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 5,
			text: ',',
		} )
	);
	assert.equal( getBlock( doc, 'p1' ).fields.content.text, 'Hello, world' );
	( { doc } = applyIntent(
		doc,
		intent( IntentTypes.DELETE_TEXT, {
			syncId: 'p1',
			start: 5,
			end: 7,
			removedText: ', ',
		} )
	) );
	assert.equal( getBlock( doc, 'p1' ).fields.content.text, 'Helloworld' );
	( { doc } = applyIntent(
		doc,
		intent( IntentTypes.FORMAT_TEXT, {
			syncId: 'p1',
			start: 0,
			end: 10,
			format: 'bold',
			on: true,
		} )
	) );
	( { doc } = applyIntent(
		doc,
		intent( IntentTypes.FORMAT_TEXT, {
			syncId: 'p1',
			start: 2,
			end: 4,
			format: 'bold',
			on: false,
		} )
	) );
	assert.deepEqual( getBlock( doc, 'p1' ).fields.content.formats, [
		{ start: 0, end: 2, format: 'bold' },
		{ start: 4, end: 10, format: 'bold' },
	] );
	( { doc } = applyIntent(
		doc,
		intent( IntentTypes.REPLACE_TEXT, {
			syncId: 'p1',
			start: 0,
			end: 5,
			removedText: 'Hello',
			text: 'Howdy',
		} )
	) );
	assert.equal( getBlock( doc, 'p1' ).fields.content.text, 'Howdyworld' );
} );

test( 'replace_attr_content replaces text wholesale and clears formats', () => {
	const { doc } = applyIntent(
		baseDoc(),
		intent( IntentTypes.REPLACE_ATTR_CONTENT, {
			syncId: 'p1',
			newText: 'agent-written',
			observedVersion: 0,
		} )
	);
	assert.equal( getBlock( doc, 'p1' ).fields.content.text, 'agent-written' );
	assert.deepEqual( getBlock( doc, 'p1' ).fields.content.formats, [] );
} );

test( 'text intents void on missing targets and clamp out-of-range offsets', () => {
	const missing = applyIntent(
		baseDoc(),
		intent( IntentTypes.INSERT_TEXT, {
			syncId: 'ghost',
			offset: 0,
			text: 'x',
		} )
	);
	assert.equal( missing.disposition.status, 'voided' );
	const clamped = applyIntent(
		baseDoc(),
		intent( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 999,
			text: '!',
		} )
	);
	assert.equal(
		getBlock( clamped.doc, 'p1' ).fields.content.text,
		'Hello world!'
	);
} );

test( 'replay is deterministic', () => {
	const log = [
		intent( IntentTypes.INSERT_TEXT, {
			syncId: 'p1',
			offset: 11,
			text: '!',
		} ),
		intent( IntentTypes.SPLIT_BLOCK, {
			syncId: 'p1',
			offset: 5,
			newSyncId: 'p1b',
		} ),
		intent( IntentTypes.MOVE_BLOCK, {
			syncId: 'p1b',
			newParentId: 'g1',
			afterSiblingId: null,
		} ),
		intent( IntentTypes.SET_ATTR, {
			syncId: 'p3',
			key: 'dropCap',
			value: true,
			observedVersion: 0,
		} ),
	];
	assert.ok(
		documentsEqual( replay( baseDoc(), log ), replay( baseDoc(), log ) )
	);
} );
