import assert from 'node:assert/strict';

import { IntentTypes, createIntent, withPayload } from '../intents.js';

const ENVELOPE = { actorId: 'dana', baseSeq: 0 };

const VALID_PAYLOADS = {
	[ IntentTypes.SET_ATTR ]: {
		syncId: 'b1',
		key: 'align',
		value: 'wide',
		observedVersion: 0,
	},
	[ IntentTypes.REMOVE_ATTR ]: {
		syncId: 'b1',
		key: 'align',
		observedVersion: 1,
	},
	[ IntentTypes.SET_PROPERTY ]: {
		name: 'title',
		value: 'A new title',
		observedVersion: 0,
	},
	[ IntentTypes.INSERT_BLOCK ]: {
		block: { syncId: 'b9', blockType: 'core/paragraph' },
		parentId: null,
		afterSiblingId: 'b1',
	},
	[ IntentTypes.REMOVE_BLOCK ]: { syncId: 'b1' },
	[ IntentTypes.MOVE_BLOCK ]: {
		syncId: 'b1',
		newParentId: 'b2',
		afterSiblingId: null,
	},
	[ IntentTypes.SPLIT_BLOCK ]: { syncId: 'b1', offset: 4, newSyncId: 'b9' },
	[ IntentTypes.MERGE_BLOCKS ]: {
		survivorId: 'b1',
		absorbedId: 'b2',
		joinOffset: 11,
	},
	[ IntentTypes.TRANSFORM_BLOCK ]: {
		syncId: 'b1',
		newBlockType: 'core/heading',
	},
	[ IntentTypes.INSERT_TEXT ]: { syncId: 'b1', offset: 2, text: 'hi' },
	[ IntentTypes.DELETE_TEXT ]: {
		syncId: 'b1',
		start: 2,
		end: 4,
		removedText: 'll',
	},
	[ IntentTypes.FORMAT_TEXT ]: {
		syncId: 'b1',
		start: 0,
		end: 5,
		format: 'bold',
		on: true,
	},
	[ IntentTypes.REPLACE_TEXT ]: {
		syncId: 'b1',
		start: 2,
		end: 4,
		removedText: 'll',
		text: 'LL',
	},
	[ IntentTypes.REPLACE_ATTR_CONTENT ]: {
		syncId: 'b1',
		newText: 'entirely new',
		observedVersion: 0,
	},
};

test( 'every vocabulary type is constructible with a valid payload', () => {
	for ( const type of Object.values( IntentTypes ) ) {
		const intent = createIntent( type, VALID_PAYLOADS[ type ], ENVELOPE );
		assert.equal( intent.type, type );
		assert.equal( intent.actorId, 'dana' );
		assert.equal( intent.baseSeq, 0 );
		assert.equal( intent.txnId, null );
		assert.ok( intent.intentId.length > 0 );
	}
} );

test( 'unknown type and malformed payloads are rejected', () => {
	assert.throws(
		() => createIntent( 'teleport_block', { syncId: 'b1' }, ENVELOPE ),
		/Unknown intent type/
	);
	assert.throws(
		() =>
			createIntent( IntentTypes.INSERT_TEXT, { syncId: 'b1' }, ENVELOPE ),
		/Invalid payload field/
	);
	assert.throws(
		() =>
			createIntent(
				IntentTypes.INSERT_TEXT,
				{ syncId: 'b1', offset: -1, text: 'x' },
				ENVELOPE
			),
		/Invalid payload field/
	);
	assert.throws(
		() =>
			createIntent(
				IntentTypes.INSERT_TEXT,
				{ syncId: 'b1', offset: 0, text: 'x', extra: true },
				ENVELOPE
			),
		/Extraneous payload/
	);
	assert.throws(
		() =>
			createIntent(
				IntentTypes.DELETE_TEXT,
				{ syncId: 'b1', start: 4, end: 2, removedText: 'xx' },
				ENVELOPE
			),
		/Range end before start/
	);
	assert.throws(
		() =>
			createIntent(
				IntentTypes.DELETE_TEXT,
				{ syncId: 'b1', start: 4, end: 4, removedText: '' },
				ENVELOPE
			),
		/Empty range/
	);
} );

test( 'nested block payloads are validated recursively', () => {
	assert.throws( () =>
		createIntent(
			IntentTypes.INSERT_BLOCK,
			{
				block: {
					syncId: 'b9',
					blockType: 'core/group',
					children: [ { blockType: 'core/paragraph' } ],
				},
				parentId: null,
				afterSiblingId: null,
			},
			ENVELOPE
		)
	);
} );

test( 'envelope requires actorId and baseSeq; txnId and intentId pass through', () => {
	assert.throws(
		() =>
			createIntent(
				IntentTypes.REMOVE_BLOCK,
				{ syncId: 'b1' },
				{ baseSeq: 0 }
			),
		/actorId/
	);
	assert.throws(
		() =>
			createIntent(
				IntentTypes.REMOVE_BLOCK,
				{ syncId: 'b1' },
				{ actorId: 'dana' }
			),
		/baseSeq/
	);
	const intent = createIntent(
		IntentTypes.REMOVE_BLOCK,
		{ syncId: 'b1' },
		{ actorId: 'dana', baseSeq: 7, txnId: 't1', intentId: 'i1' }
	);
	assert.equal( intent.txnId, 't1' );
	assert.equal( intent.intentId, 'i1' );
} );

test( 'intents are frozen; withPayload preserves envelope (attribution)', () => {
	const intent = createIntent(
		IntentTypes.INSERT_TEXT,
		{ syncId: 'b1', offset: 2, text: 'hi' },
		{ actorId: 'dana', baseSeq: 3, intentId: 'i1' }
	);
	assert.throws( () => {
		intent.payload.offset = 99;
	}, TypeError );
	const shifted = withPayload( intent, { offset: 9 } );
	assert.equal( shifted.payload.offset, 9 );
	assert.equal( shifted.payload.text, 'hi' );
	assert.equal( shifted.actorId, 'dana' );
	assert.equal( shifted.intentId, 'i1' );
	assert.equal( intent.payload.offset, 2 );
} );
