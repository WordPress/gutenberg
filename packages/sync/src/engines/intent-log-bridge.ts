/**
 * Internal dependencies
 */
import { makeBlock } from './intent-log/document.js';
import { applyIntent } from './intent-log/reducer.js';
import { mintSyncId } from './intent-log/sync-id.js';
import type {
	EngineBlock,
	EngineDocument,
	IntentEnvelope,
} from './intent-log/engine-types';

/*
 * The intent-log capture bridge: Gutenberg block trees in, intents out.
 *
 * The editor hands the sync layer FULL new state (a block tree), not deltas.
 * This module recovers deltas as typed intents by diffing the session's
 * engine document against the incoming tree, keyed by persistent block
 * identity (metadata.syncId) — never by position, so a moved block derives a
 * move_block instead of degenerating into remove+insert.
 *
 * Every derivation is VERIFIED: the derived intents are applied to the
 * current document and the result must equal the target tree canonically.
 * When verification fails, the bridge degrades per divergent block to a
 * coarse replace_attr_content (the vocabulary's designed fallback) and
 * re-verifies — capture bugs surface as measurable coarse-capture cost,
 * never as silent divergence. This is the verify-or-degrade design from
 * INTEGRATION.md, inherited from mergeRichTextUpdate's delta verification.
 *
 * v1 simplifications (documented in INTEGRATION.md):
 * - The `content` attribute maps to the engine's `content` field as an
 *   opaque HTML string (matching the server's genesis mapping); text edits
 *   diff by common prefix/suffix without a cursor hint. Rich-text-coordinate
 *   capture and multi-field schemas arrive with the editor-side bridge,
 *   where block schemas are available.
 * - split_block / merge_blocks are not derived from tree diffs (a split
 *   looks like edit+insert without selection context); identity lineage for
 *   splits arrives with action-level capture.
 */

/**
 * A serializable Gutenberg-shaped block: what the entity bridge exchanges
 * with the editor (block name, attributes, inner blocks).
 */
export interface BridgeBlock {
	name: string;
	attributes: Record< string, unknown >;
	innerBlocks: BridgeBlock[];
}

/**
 * A derived batch: the intents to author, in order, plus how many blocks
 * required the coarse fallback (0 = clean capture).
 */
export interface DerivedIntents {
	intents: Array< {
		type: string;
		payload: Record< string, unknown >;
	} >;
	coarseBlockCount: number;
}

/**
 * Duck-typed rich-text value (RichTextData has toHTMLString()).
 *
 * @param value Candidate value.
 * @return Whether it exposes toHTMLString.
 */
function isRichTextValue(
	value: unknown
): value is { toHTMLString: () => string } {
	return (
		!! value &&
		'object' === typeof value &&
		'function' ===
			typeof ( value as { toHTMLString?: unknown } ).toHTMLString
	);
}

/**
 * Normalizes an attribute value for the engine (rich text → HTML string).
 *
 * @param value Attribute value.
 * @return Serializable value.
 */
function serializeAttribute( value: unknown ): unknown {
	return isRichTextValue( value ) ? value.toHTMLString() : value;
}

/**
 * Maps one Gutenberg-shaped block (and its subtree) onto an engine block
 * spec, minting creation syncIds for blocks that lack one.
 *
 * @param block Bridge block.
 * @return Engine block spec (makeBlock input shape).
 */
export function blockToEngineSpec(
	block: BridgeBlock
): Record< string, unknown > {
	const attributes = { ...block.attributes };
	const metadata = {
		...( attributes.metadata as Record< string, unknown > | undefined ),
	};
	let syncId = metadata.syncId as string | undefined;
	if ( ! syncId ) {
		syncId = mintSyncId();
	}
	delete metadata.syncId;
	if ( Object.keys( metadata ).length > 0 ) {
		attributes.metadata = metadata;
	} else {
		delete attributes.metadata;
	}

	const text = serializeAttribute( attributes.content );
	delete attributes.content;

	const attrs: Record< string, unknown > = {};
	for ( const [ key, value ] of Object.entries( attributes ) ) {
		attrs[ key ] = serializeAttribute( value );
	}

	return {
		syncId,
		blockType: block.name,
		attrs,
		text: 'string' === typeof text ? text : '',
		children: block.innerBlocks.map( blockToEngineSpec ),
	};
}

/**
 * Maps an engine block back to the serializable Gutenberg shape, with the
 * syncId riding in metadata and the content field as the `content`
 * attribute.
 *
 * @param block Engine block.
 * @return Bridge block.
 */
export function engineBlockToBlock( block: EngineBlock ): BridgeBlock {
	const attributes: Record< string, unknown > = { ...block.attrs };
	const metadata = {
		...( attributes.metadata as Record< string, unknown > | undefined ),
		syncId: block.syncId,
	};
	attributes.metadata = metadata;
	const text = block.fields.content?.text ?? '';
	if ( '' !== text ) {
		attributes.content = text;
	}

	return {
		name: block.blockType,
		attributes,
		innerBlocks: block.children.map( engineBlockToBlock ),
	};
}

/**
 * Maps an engine document to bridge blocks.
 *
 * @param doc Engine document.
 * @return Bridge blocks.
 */
export function engineDocumentToBlocks( doc: EngineDocument ): BridgeBlock[] {
	return doc.root.map( engineBlockToBlock );
}

interface FlatEntry {
	spec: Record< string, unknown >;
	parentId: string | null;
	previousId: string | null;
}

/**
 * Flattens a spec tree into id → placement/spec entries.
 *
 * @param specs    Engine block specs.
 * @param parentId Parent id (null = root).
 * @param into     Accumulator.
 * @return The accumulator.
 */
function flattenSpecs(
	specs: Array< Record< string, unknown > >,
	parentId: string | null,
	into: Map< string, FlatEntry >
): Map< string, FlatEntry > {
	let previousId: string | null = null;
	for ( const spec of specs ) {
		const syncId = spec.syncId as string;
		into.set( syncId, { parentId, previousId, spec } );
		flattenSpecs(
			( spec.children as Array< Record< string, unknown > > ) ?? [],
			syncId,
			into
		);
		previousId = syncId;
	}
	return into;
}

/**
 * Flattens an engine document into id → placement/block entries.
 *
 * @param doc Engine document.
 * @return Flat map.
 */
function flattenDocument( doc: EngineDocument ) {
	const map = new Map<
		string,
		{
			block: EngineBlock;
			parentId: string | null;
			previousId: string | null;
		}
	>();
	const walk = ( blocks: EngineBlock[], parentId: string | null ) => {
		let previousId: string | null = null;
		for ( const block of blocks ) {
			map.set( block.syncId, { block, parentId, previousId } );
			walk( block.children, block.syncId );
			previousId = block.syncId;
		}
	};
	walk( doc.root, null );
	return map;
}

/**
 * Diffs two strings by common prefix/suffix into at most one text intent
 * payload.
 *
 * @param before Old text.
 * @param after  New text.
 * @param syncId Target block id.
 * @return An intent { type, payload }, or null when equal.
 */
function diffText(
	before: string,
	after: string,
	syncId: string
): { type: string; payload: Record< string, unknown > } | null {
	if ( before === after ) {
		return null;
	}
	let prefix = 0;
	const maxPrefix = Math.min( before.length, after.length );
	while ( prefix < maxPrefix && before[ prefix ] === after[ prefix ] ) {
		prefix++;
	}
	let suffix = 0;
	while (
		suffix < Math.min( before.length, after.length ) - prefix &&
		before[ before.length - 1 - suffix ] ===
			after[ after.length - 1 - suffix ]
	) {
		suffix++;
	}
	const removed = before.slice( prefix, before.length - suffix );
	const inserted = after.slice( prefix, after.length - suffix );
	const base = { syncId, field: 'content' };
	if ( '' === removed ) {
		return {
			type: 'insert_text',
			payload: { ...base, offset: prefix, text: inserted },
		};
	}
	if ( '' === inserted ) {
		return {
			type: 'delete_text',
			payload: {
				...base,
				start: prefix,
				end: before.length - suffix,
				removedText: removed,
			},
		};
	}
	return {
		type: 'replace_text',
		payload: {
			...base,
			start: prefix,
			end: before.length - suffix,
			removedText: removed,
			text: inserted,
		},
	};
}

/**
 * Derives intents that transform `doc` into the tree described by `blocks`.
 *
 * The result is verified by application; on divergence the affected blocks
 * degrade to coarse replacement and the batch re-verifies. Returns null in
 * the no-op case (trees already equal).
 *
 * NOTE: mutates nothing — the caller authors the returned intents through
 * its session (which applies them optimistically).
 *
 * @param doc    The session's current engine document.
 * @param blocks The editor's new block tree (bridge shape). Blocks without
 *               a metadata.syncId are treated as newly created and minted
 *               an id — callers should write the minted ids back to the
 *               editor via the returned specs.
 * @return Derived intents + the specs (with minted ids), or null.
 */
export function deriveIntents(
	doc: EngineDocument,
	blocks: BridgeBlock[]
): ( DerivedIntents & { specs: Array< Record< string, unknown > > } ) | null {
	const specs = blocks.map( blockToEngineSpec );
	const target = specsToDocument( specs );
	const targetJson = bridgeCanonical( target );
	if ( targetJson === bridgeCanonical( doc ) ) {
		return null;
	}

	const oldFlat = flattenDocument( doc );
	const newFlat = flattenSpecs( specs, null, new Map() );
	const intents: DerivedIntents[ 'intents' ] = [];

	// Removals first (they cannot invalidate later anchors: anchors are
	// computed against the new tree).
	for ( const [ syncId ] of oldFlat ) {
		if ( ! newFlat.has( syncId ) ) {
			intents.push( {
				type: 'remove_block',
				payload: { syncId },
			} );
		}
	}

	// Walk the new tree in order: insert added blocks, move relocated ones,
	// then diff type/attrs/text for survivors.
	for ( const [ syncId, entry ] of newFlat ) {
		const old = oldFlat.get( syncId );
		if ( ! old ) {
			// Skip subtree members whose ancestor is also new: the ancestor's
			// insert carries the whole subtree.
			const parentEntry = entry.parentId
				? newFlat.get( entry.parentId )
				: null;
			if ( parentEntry && ! oldFlat.has( entry.parentId! ) ) {
				continue;
			}
			intents.push( {
				type: 'insert_block',
				payload: {
					block: entry.spec,
					parentId: entry.parentId,
					afterSiblingId: entry.previousId,
				},
			} );
			continue;
		}

		if (
			old.parentId !== entry.parentId ||
			old.previousId !== entry.previousId
		) {
			intents.push( {
				type: 'move_block',
				payload: {
					syncId,
					newParentId: entry.parentId,
					afterSiblingId: entry.previousId,
				},
			} );
		}

		const oldBlock = old.block;
		const newType = entry.spec.blockType as string;
		if ( oldBlock.blockType !== newType ) {
			intents.push( {
				type: 'transform_block',
				payload: { syncId, newBlockType: newType },
			} );
		}

		const newAttrs = entry.spec.attrs as Record< string, unknown >;
		for ( const [ key, value ] of Object.entries( newAttrs ) ) {
			if (
				JSON.stringify( oldBlock.attrs[ key ] ) !==
				JSON.stringify( value )
			) {
				intents.push( {
					type: 'set_attr',
					payload: {
						syncId,
						key,
						value,
						observedVersion: oldBlock.attrVersions[ key ] ?? 0,
					},
				} );
			}
		}
		for ( const key of Object.keys( oldBlock.attrs ) ) {
			if ( ! ( key in newAttrs ) ) {
				intents.push( {
					type: 'remove_attr',
					payload: {
						syncId,
						key,
						observedVersion: oldBlock.attrVersions[ key ] ?? 0,
					},
				} );
			}
		}

		const textIntent = diffText(
			oldBlock.fields.content?.text ?? '',
			( entry.spec.text as string ) ?? '',
			syncId
		);
		if ( textIntent ) {
			intents.push( textIntent );
		}
	}

	// Verify: the derived intents must reproduce the target tree.
	if ( verifiesTo( doc, intents, targetJson ) ) {
		return { intents, coarseBlockCount: 0, specs };
	}

	/*
	 * Degrade: replace each survivor's content wholesale and retry. If even
	 * the coarse batch cannot verify (structural derivation bug), fail
	 * loudly — silent divergence is the one unacceptable outcome.
	 */
	const coarse: DerivedIntents[ 'intents' ] = intents.filter(
		( intent ) =>
			'insert_text' !== intent.type &&
			'delete_text' !== intent.type &&
			'replace_text' !== intent.type
	);
	let coarseBlockCount = 0;
	for ( const [ syncId, entry ] of newFlat ) {
		const old = oldFlat.get( syncId );
		if ( ! old ) {
			continue;
		}
		const newText = ( entry.spec.text as string ) ?? '';
		if ( ( old.block.fields.content?.text ?? '' ) !== newText ) {
			coarseBlockCount++;
			coarse.push( {
				type: 'replace_attr_content',
				payload: {
					syncId,
					field: 'content',
					newText,
					observedVersion: 0,
				},
			} );
		}
	}
	if ( ! verifiesTo( doc, coarse, targetJson ) ) {
		throw new Error(
			'Intent capture failed verification even after degrading to coarse replacement.'
		);
	}

	return { intents: coarse, coarseBlockCount, specs };
}

/**
 * Builds an engine document from specs (formats-free bridge trees).
 *
 * @param specs Engine block specs.
 * @return Engine document.
 */
function specsToDocument(
	specs: Array< Record< string, unknown > >
): EngineDocument {
	return { root: specs.map( ( spec ) => makeBlock( spec ) ) };
}

/**
 * Canonicalizes a document to the BRIDGE'S projection: block identity,
 * type, sorted attrs, content text, and structure. Engine-internal state
 * the bridge does not capture — attrVersions, format spans, syncParent
 * lineage, non-content fields — is deliberately excluded, since target
 * trees built from editor blocks never carry it and it must not fail
 * verification.
 *
 * @param doc Engine document.
 * @return Canonical JSON of the projection.
 */
function bridgeCanonical( doc: EngineDocument ): string {
	const project = ( block: EngineBlock ): Record< string, unknown > => ( {
		syncId: block.syncId,
		blockType: block.blockType,
		attrs: Object.fromEntries(
			Object.entries( block.attrs ).sort( ( [ a ], [ b ] ) =>
				a < b ? -1 : 1
			)
		),
		text: block.fields.content?.text ?? '',
		children: block.children.map( project ),
	} );
	return JSON.stringify( doc.root.map( project ) );
}

/**
 * Applies derived intents (as a synthetic same-actor batch) and compares
 * against the target canonical form.
 *
 * @param doc        Starting document.
 * @param intents    Derived intents.
 * @param targetJson Canonical target.
 * @return Whether the application reproduces the target.
 */
function verifiesTo(
	doc: EngineDocument,
	intents: DerivedIntents[ 'intents' ],
	targetJson: string
): boolean {
	let current = doc;
	for ( const intent of intents ) {
		const result = applyIntent( current, {
			intentId: 'verify',
			actorId: 'verify',
			baseSeq: 0,
			txnId: null,
			type: intent.type,
			payload: intent.payload,
		} as IntentEnvelope );
		current = result.doc;
	}
	return bridgeCanonical( current ) === targetJson;
}
