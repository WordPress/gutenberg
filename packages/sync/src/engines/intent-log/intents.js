/**
 * Intent vocabulary and envelope. See SPEC.md.
 *
 * Design principles: identity-addressed (every intent targets a syncId, never
 * a tree position); closed vocabulary with explicit lifecycle operations
 * (split/merge are first-class, never delete+insert); destructive operations
 * carry removed content so they are invertible; atomic groups via txnId.
 */

export const IntentTypes = {
	// Map family (the sync-map layer riding the same log).
	SET_ATTR: 'set_attr',
	REMOVE_ATTR: 'remove_attr',
	// Entity family: document-level properties (title, excerpt, …) as
	// per-name registers — the entity analog of the block attr map.
	SET_PROPERTY: 'set_property',
	// Structure family.
	INSERT_BLOCK: 'insert_block',
	REMOVE_BLOCK: 'remove_block',
	MOVE_BLOCK: 'move_block',
	SPLIT_BLOCK: 'split_block',
	MERGE_BLOCKS: 'merge_blocks',
	TRANSFORM_BLOCK: 'transform_block',
	// Text family.
	INSERT_TEXT: 'insert_text',
	DELETE_TEXT: 'delete_text',
	FORMAT_TEXT: 'format_text',
	REPLACE_TEXT: 'replace_text',
	// Coarse family (server-agent decomposer fallback).
	REPLACE_ATTR_CONTENT: 'replace_attr_content',
};

const isString = ( v ) => typeof v === 'string' && v.length > 0;
const isStringOrNull = ( v ) => v === null || isString( v );
const isNonNegativeInt = ( v ) => Number.isInteger( v ) && v >= 0;
const isBoolean = ( v ) => typeof v === 'boolean';
const isText = ( v ) => typeof v === 'string';
const isAny = () => true;

function isBlockPayload( block ) {
	if ( ! block || typeof block !== 'object' ) {
		return false;
	}
	if ( ! isString( block.syncId ) || ! isString( block.blockType ) ) {
		return false;
	}
	if ( block.children && ! block.children.every( isBlockPayload ) ) {
		return false;
	}
	return true;
}

const PAYLOAD_SCHEMAS = {
	[ IntentTypes.SET_ATTR ]: {
		syncId: isString,
		key: isString,
		value: isAny,
		observedVersion: isNonNegativeInt,
	},
	[ IntentTypes.REMOVE_ATTR ]: {
		syncId: isString,
		key: isString,
		observedVersion: isNonNegativeInt,
	},
	[ IntentTypes.SET_PROPERTY ]: {
		name: isString,
		value: isAny,
		observedVersion: isNonNegativeInt,
	},
	[ IntentTypes.INSERT_BLOCK ]: {
		block: isBlockPayload,
		parentId: isStringOrNull,
		afterSiblingId: isStringOrNull,
	},
	[ IntentTypes.REMOVE_BLOCK ]: {
		syncId: isString,
	},
	[ IntentTypes.MOVE_BLOCK ]: {
		syncId: isString,
		newParentId: isStringOrNull,
		afterSiblingId: isStringOrNull,
	},
	[ IntentTypes.SPLIT_BLOCK ]: {
		syncId: isString,
		field: isString,
		offset: isNonNegativeInt,
		newSyncId: isString,
	},
	[ IntentTypes.MERGE_BLOCKS ]: {
		survivorId: isString,
		absorbedId: isString,
		field: isString,
		joinOffset: isNonNegativeInt,
	},
	[ IntentTypes.TRANSFORM_BLOCK ]: {
		syncId: isString,
		newBlockType: isString,
	},
	[ IntentTypes.INSERT_TEXT ]: {
		syncId: isString,
		field: isString,
		offset: isNonNegativeInt,
		text: isString,
	},
	[ IntentTypes.DELETE_TEXT ]: {
		syncId: isString,
		field: isString,
		start: isNonNegativeInt,
		end: isNonNegativeInt,
		removedText: isText,
	},
	[ IntentTypes.FORMAT_TEXT ]: {
		syncId: isString,
		field: isString,
		start: isNonNegativeInt,
		end: isNonNegativeInt,
		format: isString,
		on: isBoolean,
	},
	[ IntentTypes.REPLACE_TEXT ]: {
		syncId: isString,
		field: isString,
		start: isNonNegativeInt,
		end: isNonNegativeInt,
		removedText: isText,
		text: isString,
	},
	[ IntentTypes.REPLACE_ATTR_CONTENT ]: {
		syncId: isString,
		field: isString,
		newText: isText,
		observedVersion: isNonNegativeInt,
	},
};

const RANGE_TYPES = new Set( [
	IntentTypes.DELETE_TEXT,
	IntentTypes.FORMAT_TEXT,
	IntentTypes.REPLACE_TEXT,
] );

export const TEXT_INTENT_TYPES = new Set( [
	IntentTypes.INSERT_TEXT,
	IntentTypes.DELETE_TEXT,
	IntentTypes.FORMAT_TEXT,
	IntentTypes.REPLACE_TEXT,
] );

/**
 * Creates a validated, frozen intent.
 *
 * @param {string} type                One of IntentTypes.
 * @param {Object} payload             Type-specific payload (see
 *                                     PAYLOAD_SCHEMAS).
 * @param {Object} envelope            Envelope fields.
 * @param {string} envelope.actorId    Authoring actor. In production this is
 *                                     stamped server-side from the
 *                                     authenticated request, never trusted
 *                                     from the client.
 * @param {number} envelope.baseSeq    Log position observed when authoring.
 * @param {string} [envelope.txnId]    Atomic group id.
 * @param {string} [envelope.intentId] Idempotency key; minted if omitted.
 * @return {Object} Frozen intent.
 */
export function createIntent( type, payload, envelope ) {
	const schema = PAYLOAD_SCHEMAS[ type ];
	if ( ! schema ) {
		throw new TypeError( `Unknown intent type: ${ type }` );
	}
	// Normalization: field-scoped intents default to the `content` field.
	// The frozen payload always carries the field explicitly.
	if ( 'field' in schema && payload.field === undefined ) {
		payload = { ...payload, field: 'content' };
	}
	for ( const [ field, predicate ] of Object.entries( schema ) ) {
		if ( ! ( field in payload ) || ! predicate( payload[ field ] ) ) {
			throw new TypeError(
				`Invalid payload field "${ field }" for intent type "${ type }"`
			);
		}
	}
	const extraneous = Object.keys( payload ).filter(
		( field ) => ! ( field in schema )
	);
	if ( extraneous.length ) {
		throw new TypeError(
			`Extraneous payload fields for "${ type }": ${ extraneous.join(
				', '
			) }`
		);
	}
	if ( RANGE_TYPES.has( type ) && payload.end < payload.start ) {
		throw new TypeError( `Range end before start for "${ type }"` );
	}
	if (
		( type === IntentTypes.DELETE_TEXT ||
			type === IntentTypes.FORMAT_TEXT ) &&
		payload.end === payload.start
	) {
		throw new TypeError( `Empty range for "${ type }"` );
	}
	if ( ! envelope || ! isString( envelope.actorId ) ) {
		throw new TypeError( 'Envelope requires an actorId' );
	}
	if ( ! isNonNegativeInt( envelope.baseSeq ) ) {
		throw new TypeError( 'Envelope requires a non-negative baseSeq' );
	}
	return Object.freeze( {
		intentId: envelope.intentId ?? globalThis.crypto.randomUUID(),
		actorId: envelope.actorId,
		baseSeq: envelope.baseSeq,
		txnId: envelope.txnId ?? null,
		type,
		payload: Object.freeze( { ...payload } ),
	} );
}

/**
 * Returns a copy of an intent with a transformed payload (used by rebase).
 * Envelope fields are preserved verbatim — attribution survives transforms.
 *
 * @param {Object} intent         Source intent.
 * @param {Object} payloadChanges Payload fields to override.
 * @return {Object} Frozen transformed intent.
 */
export function withPayload( intent, payloadChanges ) {
	return Object.freeze( {
		...intent,
		payload: Object.freeze( { ...intent.payload, ...payloadChanges } ),
	} );
}
