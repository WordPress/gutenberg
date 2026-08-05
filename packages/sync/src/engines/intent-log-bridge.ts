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
 * required the coarse fallback (0 = clean capture) and which document
 * blocks were retained despite being absent from the editor tree.
 */
export interface DerivedIntents {
	intents: Array< {
		type: string;
		payload: Record< string, unknown >;
	} >;
	coarseBlockCount: number;
	retainedIds: Set< string >;
}

/**
 * Options scoping what a capture diff may conclude.
 */
export interface DeriveOptions {
	/**
	 * Ids the editor tree is allowed to DELETE: blocks the editor has
	 * actually displayed. A document block absent from the tree but not in
	 * this set was never seen by the user — its absence is staleness, not a
	 * deletion, and it is retained (reported via retainedIds). Omit to allow
	 * all removals (trusted-tree callers).
	 */
	removableIds?: Set< string >;

	/**
	 * Ids the editor tree may still show but which were removed from the
	 * document remotely. Tree blocks with these ids are dropped from the
	 * capture (not re-inserted): a stale tree must not resurrect another
	 * user's deletion.
	 */
	excludeIds?: Set< string >;
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
 * @param block  Bridge block.
 * @param minted Optional set collecting the ids minted here (so the caller
 *               can distinguish minted ids from editor-authored ones).
 * @return Engine block spec (makeBlock input shape).
 */
export function blockToEngineSpec(
	block: BridgeBlock,
	minted?: Set< string >
): Record< string, unknown > {
	const attributes = { ...block.attributes };
	const metadata = {
		...( attributes.metadata as Record< string, unknown > | undefined ),
	};
	let syncId = metadata.syncId as string | undefined;
	if ( ! syncId ) {
		syncId = mintSyncId();
		minted?.add( syncId );
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
		children: block.innerBlocks.map( ( child ) =>
			blockToEngineSpec( child, minted )
		),
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
	const attributes: Record< string, unknown > = {};
	for ( const [ key, value ] of Object.entries( block.attrs ) ) {
		// Engine-internal attrs (e.g. the server's _wrapper markup capture)
		// never reach the editor.
		if ( ! key.startsWith( '_' ) ) {
			attributes[ key ] = value;
		}
	}
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
 * Aligns id-less specs with the document's existing identities.
 *
 * The editor parses post content without metadata.syncId, so every incoming
 * tree may lack ids for blocks the document already knows. Minting a fresh
 * id in that situation is the churn bug: each capture cycle would derive
 * remove_block + insert_block for the same block, making it flicker out of
 * existence on peers. Instead, an id-less spec ADOPTS the id of the
 * positionally corresponding document block of the same type (recursively),
 * provided no id-bearing spec in the tree already claims it. Only blocks
 * with no such counterpart keep their minted (creation) id.
 *
 * Mutates the spec objects in place (they are bridge-created).
 *
 * @param specs     Engine block specs at one level.
 * @param docBlocks Document blocks at the same level.
 * @param claimed   Ids claimed by id-bearing specs anywhere in the tree.
 * @param minted    Ids minted by blockToEngineSpec (adoption candidates).
 */
/**
 * Whether two content strings are similar enough that positional adoption
 * is safe: their common prefix plus common suffix covers the shorter one.
 * True for typing/truncation relationships (a split's head vs its source,
 * an edited paragraph vs its previous text); false for unrelated content
 * (a split's SECOND half vs the following block — the case where blind
 * positional adoption steals a neighbor's identity).
 *
 * @param a One text.
 * @param b Other text.
 * @return Whether positionally adopting across a/b is safe.
 */
function textsAreSimilar( a: string, b: string ): boolean {
	if ( a === b ) {
		return true;
	}
	const shorter = Math.min( a.length, b.length );
	if ( 0 === shorter ) {
		// One side empty: safe only when the other is short (a block just
		// being started), not when replacing a full paragraph.
		return Math.max( a.length, b.length ) <= 4;
	}
	let prefix = 0;
	while ( prefix < shorter && a[ prefix ] === b[ prefix ] ) {
		prefix++;
	}
	let suffix = 0;
	while (
		suffix < shorter - prefix &&
		a[ a.length - 1 - suffix ] === b[ b.length - 1 - suffix ]
	) {
		suffix++;
	}
	return ( prefix + suffix ) * 2 >= shorter;
}

function adoptExistingIds(
	specs: Array< Record< string, unknown > >,
	docBlocks: EngineBlock[],
	claimed: Set< string >,
	minted: Set< string >
): void {
	const unclaimedAt = ( index: number ): EngineBlock | undefined => {
		const docBlock = docBlocks[ index ];
		return docBlock && ! claimed.has( docBlock.syncId )
			? docBlock
			: undefined;
	};
	const docText = ( docBlock: EngineBlock ) =>
		docBlock.fields.content?.text ?? '';

	// Pass 1: exact-content matches (same type AND same text), preferring
	// the same position. This keeps identity with a block that merely
	// SHIFTED (e.g. the paragraph following a split point) instead of
	// letting a positional neighbor steal it.
	for ( let index = 0; index < specs.length; index++ ) {
		const spec = specs[ index ];
		if ( ! minted.has( spec.syncId as string ) ) {
			continue;
		}
		const text = ( spec.text as string ) ?? '';
		let match = unclaimedAt( index );
		if (
			! match ||
			match.blockType !== spec.blockType ||
			docText( match ) !== text
		) {
			match = docBlocks.find(
				( docBlock ) =>
					! claimed.has( docBlock.syncId ) &&
					docBlock.blockType === spec.blockType &&
					docText( docBlock ) === text
			);
		}
		if ( match ) {
			spec.syncId = match.syncId;
			claimed.add( match.syncId );
		}
	}

	// Pass 2: positional fallback, guarded by content similarity — adopts
	// across an edit (typing, truncation) but never across unrelated
	// content, which would be a different block.
	for ( let index = 0; index < specs.length; index++ ) {
		const spec = specs[ index ];
		if ( ! minted.has( spec.syncId as string ) ) {
			continue;
		}
		const docBlock = unclaimedAt( index );
		if (
			docBlock &&
			docBlock.blockType === spec.blockType &&
			textsAreSimilar(
				( spec.text as string ) ?? '',
				docText( docBlock )
			)
		) {
			spec.syncId = docBlock.syncId;
			claimed.add( docBlock.syncId );
		}
	}

	// Recurse: children pair with the children of the doc block the spec
	// resolved to (adopted or id-carrying), falling back to position.
	for ( let index = 0; index < specs.length; index++ ) {
		const spec = specs[ index ];
		const counterpart =
			docBlocks.find( ( docBlock ) => docBlock.syncId === spec.syncId ) ??
			docBlocks[ index ];
		adoptExistingIds(
			( spec.children as Array< Record< string, unknown > > ) ?? [],
			counterpart?.children ?? [],
			claimed,
			minted
		);
	}
}

function collectSpecIds(
	specs: Array< Record< string, unknown > >,
	into: Set< string >
): Set< string > {
	for ( const spec of specs ) {
		into.add( spec.syncId as string );
		collectSpecIds(
			( spec.children as Array< Record< string, unknown > > ) ?? [],
			into
		);
	}
	return into;
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
 * @param doc     The session's current engine document.
 * @param blocks  The editor's new block tree (bridge shape). Id-less blocks
 *                adopt the positionally corresponding document identity when
 *                one exists (see adoptExistingIds); otherwise they are
 *                treated as newly created with a minted id. Callers MUST
 *                write the resulting ids back to the editor via the returned
 *                specs, or the next capture cycle re-mints.
 * @param options Removability/exclusion scoping (see DeriveOptions).
 * @return Derived intents + the specs (with adopted/minted ids), or null.
 */
export function deriveIntents(
	doc: EngineDocument,
	blocks: BridgeBlock[],
	options: DeriveOptions = {}
): ( DerivedIntents & { specs: Array< Record< string, unknown > > } ) | null {
	const minted = new Set< string >();
	let specs = blocks.map( ( block ) => blockToEngineSpec( block, minted ) );
	const claimed = collectSpecIds( specs, new Set() );
	for ( const id of minted ) {
		claimed.delete( id );
	}
	adoptExistingIds( specs, doc.root, claimed, minted );
	if ( options.excludeIds && options.excludeIds.size > 0 ) {
		specs = filterExcludedSpecs( specs, options.excludeIds );
	}
	const target = specsToDocument( specs );
	const targetIds = collectSpecIds( specs, new Set() );
	const targetJson = bridgeCanonical( target );
	if ( targetJson === bridgeCanonical( doc, targetIds ) ) {
		/*
		 * Equal up to blocks absent from the tree. Absent-but-REMOVABLE
		 * blocks are deletions and need full derivation; when every absent
		 * block is non-removable (never displayed), there is nothing to
		 * author — only retention to report.
		 */
		const docIds = new Set< string >();
		const collectDocIds = ( docBlocks: EngineBlock[] ) => {
			for ( const block of docBlocks ) {
				docIds.add( block.syncId );
				collectDocIds( block.children );
			}
		};
		collectDocIds( doc.root );
		const missing = [ ...docIds ].filter( ( id ) => ! targetIds.has( id ) );
		const hasRemovableMissing = missing.some(
			( id ) => ! options.removableIds || options.removableIds.has( id )
		);
		if ( ! hasRemovableMissing ) {
			if ( 0 === missing.length ) {
				return null;
			}
			return {
				intents: [],
				coarseBlockCount: 0,
				retainedIds: new Set( missing ),
				specs,
			};
		}
	}

	const oldFlat = flattenDocument( doc );
	const newFlat = flattenSpecs( specs, null, new Map() );
	const intents: DerivedIntents[ 'intents' ] = [];
	const retainedIds = new Set< string >();

	// Removals first (they cannot invalidate later anchors: anchors are
	// computed against the new tree).
	for ( const [ syncId ] of oldFlat ) {
		if ( ! newFlat.has( syncId ) ) {
			if (
				options.removableIds &&
				! options.removableIds.has( syncId )
			) {
				// The editor never displayed this block: its absence is
				// staleness, not a user deletion — retain it.
				retainedIds.add( syncId );
				continue;
			}
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
			// Engine-internal attrs never appear in editor trees; their
			// absence there is not a removal.
			if ( ! ( key in newAttrs ) && ! key.startsWith( '_' ) ) {
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

	// Verify: the derived intents must reproduce the target tree (retained
	// blocks excluded from the comparison — they are staleness, not target).
	if ( verifiesTo( doc, intents, targetJson, targetIds ) ) {
		return { intents, coarseBlockCount: 0, retainedIds, specs };
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
	if ( ! verifiesTo( doc, coarse, targetJson, targetIds ) ) {
		throw new Error(
			'Intent capture failed verification even after degrading to coarse replacement.'
		);
	}

	return { intents: coarse, coarseBlockCount, retainedIds, specs };
}

/**
 * Drops specs (recursively) whose ids were removed from the document by
 * another actor: a stale tree must not resurrect them.
 *
 * @param specs      Engine block specs.
 * @param excludeIds Ids to drop.
 * @return Filtered specs.
 */
function filterExcludedSpecs(
	specs: Array< Record< string, unknown > >,
	excludeIds: Set< string >
): Array< Record< string, unknown > > {
	const kept: Array< Record< string, unknown > > = [];
	for ( const spec of specs ) {
		if ( excludeIds.has( spec.syncId as string ) ) {
			continue;
		}
		spec.children = filterExcludedSpecs(
			( spec.children as Array< Record< string, unknown > > ) ?? [],
			excludeIds
		);
		kept.push( spec );
	}
	return kept;
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
 * When `restrictTo` is given, blocks outside the set are omitted from the
 * projection (with their subtrees) — used to compare a document that
 * retains never-displayed blocks against a target tree that lacks them.
 *
 * @param doc        Engine document.
 * @param restrictTo Optional id allowlist.
 * @return Canonical JSON of the projection.
 */
function bridgeCanonical(
	doc: EngineDocument,
	restrictTo?: Set< string >
): string {
	const project = ( block: EngineBlock ): Record< string, unknown > => ( {
		syncId: block.syncId,
		blockType: block.blockType,
		attrs: Object.fromEntries(
			Object.entries( block.attrs )
				// Engine-internal attrs are not part of the editor-visible
				// projection (editor trees never carry them).
				.filter( ( [ key ] ) => ! key.startsWith( '_' ) )
				.sort( ( [ a ], [ b ] ) => ( a < b ? -1 : 1 ) )
		),
		text: block.fields.content?.text ?? '',
		children: projectList( block.children ),
	} );
	const projectList = ( blocks: EngineBlock[] ): unknown[] =>
		blocks
			.filter(
				( block ) => ! restrictTo || restrictTo.has( block.syncId )
			)
			.map( project );
	return JSON.stringify( projectList( doc.root ) );
}

/**
 * Applies derived intents (as a synthetic same-actor batch) and compares
 * against the target canonical form.
 *
 * @param doc        Starting document.
 * @param intents    Derived intents.
 * @param targetJson Canonical target.
 * @param restrictTo Optional id allowlist for the comparison.
 * @return Whether the application reproduces the target.
 */
function verifiesTo(
	doc: EngineDocument,
	intents: DerivedIntents[ 'intents' ],
	targetJson: string,
	restrictTo?: Set< string >
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
	return bridgeCanonical( current, restrictTo ) === targetJson;
}
