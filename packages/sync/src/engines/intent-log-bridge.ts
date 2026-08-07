/**
 * Internal dependencies
 */
import { makeBlock } from './intent-log/document.js';
import { applyIntent } from './intent-log/reducer.js';
import { mintSyncId } from './intent-log/sync-id.js';
import { fieldToHtml, htmlToField } from './intent-log/rich-text.js';
import type {
	EngineBlock,
	EngineDocument,
	EngineField,
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
 * TEXT COORDINATES ARE RICH-TEXT COORDINATES: every rich-text attribute the
 * block registry declares becomes an engine FIELD via the rich-text codec
 * (plain text + format spans, UTF-16 code units — see rich-text.js). Text
 * intents therefore carry offsets over plain text, never over serialized
 * markup: concurrent merges interleave in text space and can never land
 * inside a tag. Format changes derive as format_text intents; a paragraph
 * split derives split_block and a paragraph merge derives merge_blocks, so
 * the engine's split/merge/format concurrency semantics are reachable from
 * real typing.
 *
 * Every derivation is VERIFIED: the derived intents are applied to the
 * current document and the result must equal the target tree canonically
 * (fields INCLUDED — text and formats). When verification fails, the bridge
 * degrades per divergent field to a coarse replace_attr_content plus format
 * restoration and re-verifies — capture bugs surface as measurable
 * coarse-capture cost, never as silent divergence.
 */

/**
 * A serializable Gutenberg-shaped block: what the entity bridge exchanges
 * with the editor (block name, attributes, inner blocks).
 */
export interface BridgeBlock {
	name: string;
	attributes: Record< string, unknown >;
	innerBlocks: BridgeBlock[];
	/**
	 * Static HTML fragments interleaved with inner-block slots (null
	 * entries) — the content model of raw-content blocks (core/html),
	 * whose markup lives OUTSIDE attributes.
	 */
	innerContent?: Array< string | null >;
}

/**
 * Names a block type's rich-text attributes (the ones that become engine
 * fields). The editor side supplies a resolver backed by the block
 * registry; the default captures the conventional `content` attribute.
 */
export type RichTextFieldsResolver = ( blockName: string ) => string[];

const defaultRichTextFields: RichTextFieldsResolver = () => [ 'content' ];

/**
 * Adapter for raw-content block types (core/html): blocks whose markup
 * lives in innerContent fragments rather than any attribute. Their content
 * becomes the engine's `content` FIELD through the codec (matching the
 * server's genesis/materialize treatment of innerHTML), with inner blocks
 * flattened into the serialized string.
 */
export interface RawContentAdapter {
	/** Whether the named block type is a raw-content block. */
	is: ( blockName: string ) => boolean;
	/** The block's full inner HTML (fragments + serialized inner blocks). */
	serialize: ( block: BridgeBlock ) => string;
	/**
	 * Where the HTML lives on the editor block: core/html uses
	 * innerContent fragments, core/freeform a source:"raw" content
	 * attribute. Omitted, innerContent form is used.
	 */
	hydrate?: (
		blockName: string,
		html: string
	) => Pick< Partial< BridgeBlock >, 'attributes' | 'innerContent' >;
}

/** The engine field a raw-content block's markup lives in. */
const RAW_CONTENT_FIELDS = [ 'content' ];

/**
 * The field names carried for a block type: raw-content blocks always use
 * the `content` field; others come from the rich-text resolver.
 *
 * @param blockName Block type name.
 * @param resolver  Rich-text attribute names per block type.
 * @param raw       Raw-content adapter.
 * @return Field names.
 */
function fieldNamesFor(
	blockName: string,
	resolver: RichTextFieldsResolver,
	raw?: RawContentAdapter
): string[] {
	return raw?.is( blockName ) ? RAW_CONTENT_FIELDS : resolver( blockName );
}

/**
 * A derived batch: the intents to author, in order, plus how many fields
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

	/** Rich-text attribute names per block type (default: content only). */
	richTextFields?: RichTextFieldsResolver;

	/** Raw-content block handling (core/html-style innerContent markup). */
	rawContent?: RawContentAdapter;
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
 * spec, minting creation syncIds for blocks that lack one. Rich-text
 * attributes become codec fields (plain text + format spans).
 *
 * @param block    Bridge block.
 * @param resolver Rich-text attribute names per block type.
 * @param minted   Optional set collecting the ids minted here (so the caller
 *                 can distinguish minted ids from editor-authored ones).
 * @param seenIds  Optional set of ids already used in this tree; later
 *                 duplicates re-mint (the first occurrence keeps identity).
 * @param raw      Raw-content block handling (core/html-style markup).
 * @return Engine block spec (makeBlock input shape).
 */
export function blockToEngineSpec(
	block: BridgeBlock,
	resolver: RichTextFieldsResolver = defaultRichTextFields,
	minted?: Set< string >,
	seenIds?: Set< string >,
	raw?: RawContentAdapter
): Record< string, unknown > {
	const attributes = { ...block.attributes };
	const metadata = {
		...( attributes.metadata as Record< string, unknown > | undefined ),
	};
	let syncId = metadata.syncId as string | undefined;
	/*
	 * Duplicate ids in one tree: the FIRST occurrence keeps the identity
	 * (split policy: the head keeps its id); later occurrences re-mint.
	 * Gutenberg's split copies all attributes — metadata.syncId included —
	 * to the second half, so this is the normal shape of a split arriving
	 * before the id stamper's dedupe lands.
	 */
	if ( syncId && seenIds?.has( syncId ) ) {
		syncId = undefined;
	}
	if ( ! syncId ) {
		syncId = mintSyncId();
		minted?.add( syncId );
	}
	seenIds?.add( syncId );
	delete metadata.syncId;
	if ( Object.keys( metadata ).length > 0 ) {
		attributes.metadata = metadata;
	} else {
		delete attributes.metadata;
	}

	const fields: Record< string, EngineField > = {};
	let children: Array< Record< string, unknown > >;
	if ( raw?.is( block.name ) ) {
		/*
		 * Raw-content block: the markup lives in innerContent, not any
		 * attribute — serialize it (inner blocks flattened in) into the
		 * content FIELD through the codec, matching the server's
		 * genesis/materialize treatment of innerHTML. A stale content
		 * attribute (the deprecated createBlock path) is dropped; the
		 * field is the single source of truth.
		 */
		fields.content = htmlToField( raw.serialize( block ) );
		delete attributes.content;
		children = [];
	} else {
		for ( const name of resolver( block.name ) ) {
			const value = serializeAttribute( attributes[ name ] );
			delete attributes[ name ];
			fields[ name ] = htmlToField(
				'string' === typeof value ? value : ''
			);
		}
		children = block.innerBlocks.map( ( child ) =>
			blockToEngineSpec( child, resolver, minted, seenIds, raw )
		);
	}

	const attrs: Record< string, unknown > = {};
	for ( const [ key, value ] of Object.entries( attributes ) ) {
		attrs[ key ] = serializeAttribute( value );
	}

	return {
		syncId,
		blockType: block.name,
		attrs,
		fields,
		children,
	};
}

/**
 * Maps an engine block back to the serializable Gutenberg shape, with the
 * syncId riding in metadata and each RESOLVER-NAMED field serialized back
 * to its attribute through the codec. Fields the resolver does not name
 * (e.g. a server genesis content field for an attribute-less block) stay
 * engine-side.
 *
 * @param block    Engine block.
 * @param resolver Rich-text attribute names per block type.
 * @param raw      Raw-content block handling (core/html-style markup).
 * @return Bridge block.
 */
export function engineBlockToBlock(
	block: EngineBlock,
	resolver: RichTextFieldsResolver = defaultRichTextFields,
	raw?: RawContentAdapter
): BridgeBlock {
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
	if ( raw?.is( block.blockType ) ) {
		// Raw-content block: the content field's HTML re-enters the
		// block's own content model — innerContent fragments (core/html)
		// or a raw content attribute (core/freeform).
		const field = block.fields.content;
		const html = field ? fieldToHtml( field ) : '';
		const hydrated = raw.hydrate?.( block.blockType, html ) ?? {
			innerContent: '' === html ? [] : [ html ],
		};
		return {
			name: block.blockType,
			attributes: { ...attributes, ...( hydrated.attributes ?? {} ) },
			innerBlocks: [],
			...( hydrated.innerContent
				? { innerContent: hydrated.innerContent }
				: {} ),
		};
	}
	for ( const name of resolver( block.blockType ) ) {
		const field = block.fields[ name ];
		if (
			field &&
			( '' !== field.text || ( field.formats?.length ?? 0 ) > 0 )
		) {
			attributes[ name ] = fieldToHtml( field );
		}
	}

	return {
		name: block.blockType,
		attributes,
		innerBlocks: block.children.map( ( child ) =>
			engineBlockToBlock( child, resolver, raw )
		),
	};
}

/**
 * Maps an engine document to bridge blocks.
 *
 * @param doc      Engine document.
 * @param resolver Rich-text attribute names per block type.
 * @param raw      Raw-content block handling (core/html-style markup).
 * @return Bridge blocks.
 */
export function engineDocumentToBlocks(
	doc: EngineDocument,
	resolver: RichTextFieldsResolver = defaultRichTextFields,
	raw?: RawContentAdapter
): BridgeBlock[] {
	return doc.root.map( ( block ) =>
		engineBlockToBlock( block, resolver, raw )
	);
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

const specField = (
	spec: Record< string, unknown >,
	name: string
): EngineField =>
	( ( spec.fields as Record< string, EngineField > | undefined )?.[
		name
	] as EngineField ) ?? { text: '', formats: [] };

const specText = ( spec: Record< string, unknown > ): string =>
	specField( spec, 'content' ).text;

const blockField = ( block: EngineBlock, name: string ): EngineField =>
	block.fields[ name ] ?? { text: '', formats: [] };

/**
 * Diffs two plain texts by common prefix/suffix into at most one text intent
 * payload.
 *
 * @param before Old text.
 * @param after  New text.
 * @param syncId Target block id.
 * @param field  Field name.
 * @return An intent { type, payload }, or null when equal.
 */
function diffText(
	before: string,
	after: string,
	syncId: string,
	field: string
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
	const base = { syncId, field };
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
 * Derives format_text intents transforming one field's spans into
 * another's, for fields whose TEXT already matches. Membership is computed
 * per format id per character; contiguous runs of difference become one
 * intent each.
 *
 * @param before Field with current spans.
 * @param after  Field with target spans.
 * @param syncId Target block id.
 * @param field  Field name.
 * @return format_text intents.
 */
function diffFormats(
	before: EngineField,
	after: EngineField,
	syncId: string,
	field: string
): Array< { type: string; payload: Record< string, unknown > } > {
	if ( before.text !== after.text ) {
		return [];
	}
	const length = after.text.length;
	const membership = ( spans: EngineField[ 'formats' ], format: string ) => {
		const chars = new Array( length ).fill( false );
		for ( const span of spans ) {
			if ( span.format !== format ) {
				continue;
			}
			for (
				let i = Math.max( 0, span.start );
				i < Math.min( length, span.end );
				i++
			) {
				chars[ i ] = true;
			}
		}
		return chars;
	};
	const formatIds = new Set< string >();
	for ( const span of before.formats ?? [] ) {
		formatIds.add( span.format );
	}
	for ( const span of after.formats ?? [] ) {
		formatIds.add( span.format );
	}
	const intents: Array< {
		type: string;
		payload: Record< string, unknown >;
	} > = [];
	for ( const format of [ ...formatIds ].sort() ) {
		const beforeChars = membership( before.formats ?? [], format );
		const afterChars = membership( after.formats ?? [], format );
		let run: { on: boolean; start: number } | null = null;
		for ( let i = 0; i <= length; i++ ) {
			const state =
				i < length && beforeChars[ i ] !== afterChars[ i ]
					? afterChars[ i ]
					: null;
			if ( run && ( null === state || state !== run.on ) ) {
				intents.push( {
					type: 'format_text',
					payload: {
						syncId,
						field,
						start: run.start,
						end: i,
						format,
						on: run.on,
					},
				} );
				run = null;
			}
			if ( null !== state && ! run ) {
				run = { on: state, start: i };
			}
		}
	}
	return intents;
}

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
	eligible: Set< string >
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
		if ( ! eligible.has( spec.syncId as string ) ) {
			continue;
		}
		const text = specText( spec );
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
		if ( ! eligible.has( spec.syncId as string ) ) {
			continue;
		}
		const docBlock = unclaimedAt( index );
		if (
			docBlock &&
			docBlock.blockType === spec.blockType &&
			textsAreSimilar( specText( spec ), docText( docBlock ) )
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
			eligible
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
 * Derives split_block / merge_blocks for the content field from
 * identity + concatenation signals, per sibling level:
 *
 * - SPLIT: a document block's text partitions exactly into its spec text
 *   followed by a NEW (document-unknown) same-type sibling's text — the
 *   shape Enter-in-a-paragraph produces. The new spec's id becomes the
 *   split's newSyncId, so identity is agreed before the server ever sees
 *   the block.
 * - MERGE: two adjacent document siblings' texts concatenate exactly into
 *   one surviving spec's text while the absorbed block left the tree (and
 *   the editor testified it displayed it) — the Backspace-join shape.
 *
 * Guards are exact (strict concatenation, same type, childless absorbed
 * block); anything murkier falls through to the general differ.
 *
 * @param doc     Engine document.
 * @param specs   Adopted engine specs (root level).
 * @param options Derive options (removableIds gate merges).
 * @return Structural text intents, in application order.
 */
function deriveSplitsAndMerges(
	doc: EngineDocument,
	specs: Array< Record< string, unknown > >,
	options: DeriveOptions
): Array< { type: string; payload: Record< string, unknown > } > {
	const intents: Array< {
		type: string;
		payload: Record< string, unknown >;
	} > = [];
	const docIds = new Set< string >();
	const collect = ( blocks: EngineBlock[] ) => {
		for ( const block of blocks ) {
			docIds.add( block.syncId );
			collect( block.children );
		}
	};
	collect( doc.root );
	const specIds = collectSpecIds( specs, new Set() );

	const walkLevel = (
		levelSpecs: Array< Record< string, unknown > >,
		docBlocks: EngineBlock[]
	) => {
		const docById = new Map(
			docBlocks.map( ( block ) => [ block.syncId, block ] )
		);
		for ( let i = 0; i < levelSpecs.length; i++ ) {
			const spec = levelSpecs[ i ];
			const docBlock = docById.get( spec.syncId as string );
			const next = levelSpecs[ i + 1 ];

			// SPLIT: doc text === head spec text + NEW next spec text.
			if (
				docBlock &&
				next &&
				! docIds.has( next.syncId as string ) &&
				next.blockType === spec.blockType &&
				0 ===
					( ( next.children as unknown[] | undefined )?.length ?? 0 )
			) {
				const docContent = blockField( docBlock, 'content' ).text;
				const headText = specText( spec );
				const tailText = specText( next );
				if (
					docContent === headText + tailText &&
					'' !== tailText &&
					docContent !== headText
				) {
					intents.push( {
						type: 'split_block',
						payload: {
							syncId: spec.syncId as string,
							field: 'content',
							offset: headText.length,
							newSyncId: next.syncId as string,
						},
					} );
					docIds.add( next.syncId as string );
				}
			}

			// MERGE: spec text === doc text + NEXT doc sibling's text, the
			// sibling gone from the tree and removable.
			if ( docBlock ) {
				const docIndex = docBlocks.indexOf( docBlock );
				const absorbed = docBlocks[ docIndex + 1 ];
				if (
					absorbed &&
					! specIds.has( absorbed.syncId ) &&
					0 === absorbed.children.length &&
					( ! options.removableIds ||
						options.removableIds.has( absorbed.syncId ) )
				) {
					const survivorText = blockField( docBlock, 'content' ).text;
					const absorbedText = blockField( absorbed, 'content' ).text;
					if (
						'' !== absorbedText &&
						specText( spec ) === survivorText + absorbedText
					) {
						intents.push( {
							type: 'merge_blocks',
							payload: {
								survivorId: docBlock.syncId,
								absorbedId: absorbed.syncId,
								field: 'content',
								joinOffset: survivorText.length,
							},
						} );
					}
				}
			}

			// Recurse into matching children.
			if ( docBlock ) {
				walkLevel(
					( spec.children as Array< Record< string, unknown > > ) ??
						[],
					docBlock.children
				);
			}
		}
	};
	walkLevel( specs, doc.root );
	return intents;
}

/**
 * Derives intents that transform `doc` into the tree described by `blocks`.
 *
 * The result is verified by application; on divergence the affected fields
 * degrade to coarse replacement (with format restoration) and the batch
 * re-verifies. Returns null in the no-op case (trees already equal).
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
 * @param options Removability/exclusion/field scoping (see DeriveOptions).
 * @return Derived intents + the specs (with adopted/minted ids), or null.
 */
export function deriveIntents(
	doc: EngineDocument,
	blocks: BridgeBlock[],
	options: DeriveOptions = {}
): ( DerivedIntents & { specs: Array< Record< string, unknown > > } ) | null {
	const resolver = options.richTextFields ?? defaultRichTextFields;
	const raw = options.rawContent;
	const minted = new Set< string >();
	const seenIds = new Set< string >();
	let specs = blocks.map( ( block ) =>
		blockToEngineSpec( block, resolver, minted, seenIds, raw )
	);
	/*
	 * Adoption eligibility: a spec may take over a document identity when
	 * its own id is UNKNOWN to the document — freshly minted here, or an
	 * editor-stamped creation id for content the document already tracks
	 * under a different identity (e.g. the server's deterministic genesis
	 * ids). Ids the document knows are fixed points; they claim themselves.
	 */
	const docIds = new Set< string >();
	const collectDocumentIds = ( docBlocks: EngineBlock[] ) => {
		for ( const docBlock of docBlocks ) {
			docIds.add( docBlock.syncId );
			collectDocumentIds( docBlock.children );
		}
	};
	collectDocumentIds( doc.root );
	const eligible = new Set< string >();
	const claimed = new Set< string >();
	for ( const id of collectSpecIds( specs, new Set() ) ) {
		if ( docIds.has( id ) ) {
			claimed.add( id );
		} else {
			eligible.add( id );
		}
	}
	adoptExistingIds( specs, doc.root, claimed, eligible );
	/*
	 * An explicitly-undefined attr value in the editor tree is a
	 * normalization artifact (role:"local" attributes surface as undefined
	 * on some passes — core/html content), not testimony: carry the
	 * document's current value so the diff derives nothing and
	 * verification does not read the artifact as a change. For ids the
	 * document does not know (fresh inserts) the key is dropped — an
	 * undefined attr is not expressible on the wire anyway.
	 */
	const docBlocksById = new Map< string, EngineBlock >();
	const indexDocBlocks = ( docBlocks: EngineBlock[] ) => {
		for ( const docBlock of docBlocks ) {
			docBlocksById.set( docBlock.syncId, docBlock );
			indexDocBlocks( docBlock.children );
		}
	};
	indexDocBlocks( doc.root );
	const fillUndefinedAttrs = (
		specList: Array< Record< string, unknown > >
	) => {
		for ( const spec of specList ) {
			const attrs = spec.attrs as Record< string, unknown >;
			const docBlock = docBlocksById.get( spec.syncId as string );
			for ( const key of Object.keys( attrs ) ) {
				if ( undefined !== attrs[ key ] ) {
					continue;
				}
				if ( docBlock && key in docBlock.attrs ) {
					attrs[ key ] = docBlock.attrs[ key ];
				} else {
					delete attrs[ key ];
				}
			}
			fillUndefinedAttrs(
				spec.children as Array< Record< string, unknown > >
			);
		}
	};
	fillUndefinedAttrs( specs );
	if ( options.excludeIds && options.excludeIds.size > 0 ) {
		specs = filterExcludedSpecs( specs, options.excludeIds );
	}
	const target = specsToDocument( specs );
	const targetIds = collectSpecIds( specs, new Set() );
	const fieldNames: RichTextFieldsResolver = ( name ) =>
		fieldNamesFor( name, resolver, raw );
	const targetJson = bridgeCanonical( target, fieldNames );
	if ( targetJson === bridgeCanonical( doc, fieldNames, targetIds ) ) {
		/*
		 * Equal up to blocks absent from the tree. Absent-but-REMOVABLE
		 * blocks are deletions and need full derivation; when every absent
		 * block is non-removable (never displayed), there is nothing to
		 * author — only retention to report. (docIds collected above.)
		 */
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

	/*
	 * Structural text ops first: splits and merges derived from identity +
	 * concatenation signals apply to a scratch document, and the general
	 * differ then works against that — the split's tail already exists,
	 * the merge's absorbed block is already gone.
	 */
	const structural = deriveSplitsAndMerges( doc, specs, options );
	let workingDoc = doc;
	for ( const intent of structural ) {
		workingDoc = applyScratch( workingDoc, intent );
	}

	const oldFlat = flattenDocument( workingDoc );
	const newFlat = flattenSpecs( specs, null, new Map() );
	const intents: DerivedIntents[ 'intents' ] = [ ...structural ];
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
	// then diff type/attrs/fields for survivors.
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
			/*
			 * An explicitly-undefined editor value is a normalization
			 * artifact (role:"local" attributes surface as undefined on
			 * some passes — core/html content), not an authored edit, and
			 * it is not even expressible on the wire: JSON.stringify drops
			 * the key, producing a schema-invalid set_attr that poisons
			 * the whole batch. Absence is only intent if the editor
			 * testified otherwise — skip. (The presence of the KEY also
			 * keeps the remove_attr pass below from reading it as a
			 * removal.)
			 */
			if ( undefined === value ) {
				continue;
			}
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

		for ( const field of fieldNames( newType ) ) {
			const textIntent = diffText(
				blockField( oldBlock, field ).text,
				specField( entry.spec, field ).text,
				syncId,
				field
			);
			if ( textIntent ) {
				intents.push( textIntent );
			}
		}
	}

	/*
	 * Format derivation: apply everything so far to a scratch document (the
	 * reducer shifts existing spans through the text edits), then diff each
	 * surviving field's spans against the target and emit format_text runs.
	 */
	let scratch = doc;
	for ( const intent of intents ) {
		scratch = applyScratch( scratch, intent );
	}
	const scratchFlat = flattenDocument( scratch );
	for ( const [ syncId, entry ] of newFlat ) {
		const scratchEntry = scratchFlat.get( syncId );
		if ( ! scratchEntry ) {
			continue;
		}
		for ( const field of fieldNames( entry.spec.blockType as string ) ) {
			intents.push(
				...diffFormats(
					blockField( scratchEntry.block, field ),
					specField( entry.spec, field ),
					syncId,
					field
				)
			);
		}
	}

	// Verify: the derived intents must reproduce the target tree (retained
	// blocks excluded from the comparison — they are staleness, not target).
	if ( verifiesTo( doc, intents, targetJson, fieldNames, targetIds ) ) {
		return { intents, coarseBlockCount: 0, retainedIds, specs };
	}

	/*
	 * Degrade: replace each divergent field wholesale (text via the coarse
	 * op, spans restored via format_text — replace_attr_content clears
	 * formats) and retry. If even the coarse batch cannot verify
	 * (structural derivation bug), fail loudly — silent divergence is the
	 * one unacceptable outcome.
	 */
	const coarse: DerivedIntents[ 'intents' ] = intents.filter(
		( intent ) =>
			'insert_text' !== intent.type &&
			'delete_text' !== intent.type &&
			'replace_text' !== intent.type &&
			'format_text' !== intent.type &&
			'split_block' !== intent.type &&
			'merge_blocks' !== intent.type
	);
	let coarseBlockCount = 0;
	const coarseOldFlat = flattenDocument( doc );
	for ( const [ syncId, entry ] of newFlat ) {
		const old = coarseOldFlat.get( syncId );
		if ( ! old ) {
			continue;
		}
		for ( const field of fieldNames( entry.spec.blockType as string ) ) {
			const targetField = specField( entry.spec, field );
			const docField = blockField( old.block, field );
			if (
				docField.text === targetField.text &&
				JSON.stringify( docField.formats ) ===
					JSON.stringify( targetField.formats )
			) {
				continue;
			}
			coarseBlockCount++;
			coarse.push( {
				type: 'replace_attr_content',
				payload: {
					syncId,
					field,
					newText: targetField.text,
					observedVersion: 0,
				},
			} );
			for ( const span of targetField.formats ?? [] ) {
				if ( span.end > span.start ) {
					coarse.push( {
						type: 'format_text',
						payload: {
							syncId,
							field,
							start: span.start,
							end: span.end,
							format: span.format,
							on: true,
						},
					} );
				}
			}
		}
	}
	if ( ! verifiesTo( doc, coarse, targetJson, fieldNames, targetIds ) ) {
		throw new Error(
			'Intent capture failed verification even after degrading to coarse replacement.'
		);
	}

	return { intents: coarse, coarseBlockCount, retainedIds, specs };
}

/**
 * Applies one derived intent to a scratch document (synthetic envelope).
 *
 * @param doc            Document.
 * @param intent         Derived intent.
 * @param intent.type    Intent type.
 * @param intent.payload Intent payload.
 * @return Next document.
 */
function applyScratch(
	doc: EngineDocument,
	intent: { type: string; payload: Record< string, unknown > }
): EngineDocument {
	return applyIntent( doc, {
		intentId: 'scratch',
		actorId: 'scratch',
		baseSeq: 0,
		txnId: null,
		type: intent.type,
		payload: intent.payload,
	} as IntentEnvelope ).doc;
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
 * Builds an engine document from specs.
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
 * type, sorted attrs, RESOLVER-NAMED fields (text AND format spans), and
 * structure. Engine-internal state the bridge does not capture —
 * attrVersions, syncParent lineage, fields outside the resolver's schema —
 * is deliberately excluded, since target trees built from editor blocks
 * never carry it and it must not fail verification.
 *
 * When `restrictTo` is given, blocks outside the set are omitted from the
 * projection (with their subtrees) — used to compare a document that
 * retains never-displayed blocks against a target tree that lacks them.
 *
 * @param doc        Engine document.
 * @param resolver   Rich-text attribute names per block type.
 * @param restrictTo Optional id allowlist.
 * @return Canonical JSON of the projection.
 */
function bridgeCanonical(
	doc: EngineDocument,
	resolver: RichTextFieldsResolver,
	restrictTo?: Set< string >
): string {
	const canonicalField = ( field: EngineField ) => ( {
		text: field.text,
		formats: [ ...( field.formats ?? [] ) ].sort(
			( a, b ) =>
				a.start - b.start ||
				a.end - b.end ||
				( a.format < b.format ? -1 : 1 )
		),
	} );
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
		fields: Object.fromEntries(
			resolver( block.blockType )
				.slice()
				.sort()
				.map( ( name ) => [
					name,
					canonicalField( blockField( block, name ) ),
				] )
		),
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
 * @param resolver   Rich-text attribute names per block type.
 * @param restrictTo Optional id allowlist for the comparison.
 * @return Whether the application reproduces the target.
 */
function verifiesTo(
	doc: EngineDocument,
	intents: DerivedIntents[ 'intents' ],
	targetJson: string,
	resolver: RichTextFieldsResolver,
	restrictTo?: Set< string >
): boolean {
	let current = doc;
	for ( const intent of intents ) {
		current = applyScratch( current, intent );
	}
	return bridgeCanonical( current, resolver, restrictTo ) === targetJson;
}
