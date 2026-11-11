import { v4 as uuidv4 } from 'uuid';
import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import { getBlockTypes } from '@wordpress/blocks';
import { RichTextData } from '@wordpress/rich-text';
import { Y } from '@wordpress/sync';
import {
	asRichTextOffset,
	createYMap,
	richTextOffsetToHtmlIndex,
	type HtmlStringIndex,
	type YMapRecord,
	type YMapWrap,
} from './crdt-utils';
import { getCachedRichTextData } from './crdt-text';
import { Delta } from '../sync';
import { type WPBlockSelection } from '../types';

interface BlockAttributes {
	[ key: string ]: unknown;
}

interface BlockAttributeSchema {
	role?: string;
	type?: string;
	query?: Record< string, BlockAttributeSchema >;
}

interface BlockType {
	attributes?: Record< string, BlockAttributeSchema >;
	name: string;
}

// A block as represented in Gutenberg's data store.
export interface Block {
	attributes: BlockAttributes;
	clientId?: string;
	innerBlocks: Block[];
	innerContent?: Array< string | null >;
	isValid?: boolean;
	name: string;
	originalContent?: string;
	validationIssues?: string[]; // unserializable
}

// A block as represented in the CRDT document (Y.Map).
export interface YBlockRecord extends YMapRecord {
	attributes: YBlockAttributes;
	clientId: string;
	innerBlocks: YBlocks;
	isValid?: boolean;
	originalContent?: string;
	name: string;
}

export type YBlock = YMapWrap< YBlockRecord >;
export type YBlocks = Y.Array< YBlock >;

// Block attribute schema cannot be known at compile time, so we use Y.Map.
// Attribute values will be typed as the union of `Y.Text` and `unknown`.
export type YBlockAttributes = Y.Map< Y.Text | unknown >;

interface MergeCrdtBlocksOptions {
	preserveClientIds?: boolean;
}

/**
 * Optional description of where a cursor falls.
 *
 * Used to coordinate shifting of cursor when applying changes
 * to a Y.Doc with RichText instances.
 */
export type MergeCursorPosition = WPBlockSelection | null;

const serializableBlocksCache = new WeakMap< WeakKey, Block[] >();

/**
 * Recursively walk an attribute value and convert any RichTextData instances
 * to their string (HTML) representation. This is necessary for array-type and
 * object-type attributes, which can contain nested RichTextData.
 *
 * @param value The attribute value to serialize.
 * @return The value with all RichTextData instances replaced by strings.
 */
function serializeAttributeValue( value: unknown ): unknown {
	if ( value instanceof RichTextData ) {
		return value.valueOf();
	}

	// e.g. core/table `body`: [ { cells: [ { content: RichTextData } ] } ]
	if ( Array.isArray( value ) ) {
		return value.map( serializeAttributeValue );
	}

	// e.g. a single row inside core/table `body`: { cells: [ ... ] }
	if ( value && typeof value === 'object' ) {
		const result: Record< string, unknown > = {};

		for ( const [ k, v ] of Object.entries( value ) ) {
			result[ k ] = serializeAttributeValue( v );
		}
		return result;
	}

	return value;
}

function makeBlockAttributesSerializable(
	blockName: string,
	attributes: BlockAttributes
): BlockAttributes {
	const newAttributes = { ...attributes };
	for ( const [ key, value ] of Object.entries( attributes ) ) {
		if ( isLocalAttribute( blockName, key ) ) {
			delete newAttributes[ key ];
			continue;
		}

		newAttributes[ key ] = serializeAttributeValue( value );
	}
	return newAttributes;
}

/**
 * Recursively removes properties which cannot be serialized from a list of block objects.
 *
 * @param blocks Eemove unserializable properties from each block object in this set.
 * @return Copies of the provided blocks without the unserializable properties.
 */
function makeBlocksSerializable( blocks: Block[] ): Block[] {
	return blocks.map( ( block: Block ) => {
		const {
			name,
			innerBlocks,
			attributes,
			/*
			 * Any validation issues discovered when loading a block are appended
			 * to the block node with a logging function, which cannot be serialized.
			 *
			 * @see import("@wordpress/blocks/src/api/parser").parseRawBlock()
			 */
			validationIssues,
			...rest
		} = block;

		return {
			...rest,
			name,
			attributes: makeBlockAttributesSerializable( name, attributes ),
			innerBlocks: makeBlocksSerializable( innerBlocks ),
		};
	} );
}

/**
 * Recursively walk an attribute value and convert any strings that correspond
 * to rich-text schema nodes into RichTextData instances. This is the inverse
 * of serializeAttributeValue and handles nested structures like table cells.
 *
 * @param schema The attribute type definition for this value.
 * @param value  The attribute value from CRDT (toJSON).
 * @return The value with rich-text strings replaced by RichTextData.
 */
function deserializeAttributeValue(
	schema: BlockAttributeSchema | undefined,
	value: unknown
): unknown {
	if ( schema?.type === 'rich-text' && typeof value === 'string' ) {
		return getCachedRichTextData( value );
	}

	// e.g. core/table `body`: [ { cells: [ { content: RichTextData } ] } ]
	if ( Array.isArray( value ) ) {
		return value.map( ( item ) =>
			deserializeAttributeValue( schema, item )
		);
	}

	// e.g. a single row inside core/table `body`: { cells: [ ... ] }
	if ( value && typeof value === 'object' ) {
		const result: Record< string, unknown > = {};

		for ( const [ key, innerValue ] of Object.entries(
			value as Record< string, unknown >
		) ) {
			result[ key ] = deserializeAttributeValue(
				schema?.query?.[ key ],
				innerValue
			);
		}

		return result;
	}

	return value;
}

/**
 * Convert blocks from their CRDT-serialized form back to the runtime form
 * expected by the block editor. Rich-text attributes are stored as Y.Text in
 * the CRDT document, which serializes to plain strings via toJSON(). This
 * function restores them to RichTextData instances so that block edit
 * components that rely on RichTextData methods (e.g. `.text`) work correctly.
 *
 * @param blocks Blocks as extracted from the CRDT document via toJSON().
 * @return Blocks with rich-text attributes restored to RichTextData.
 */
export function deserializeBlockAttributes( blocks: Block[] ): Block[] {
	return blocks.map( ( block: Block ) => {
		const { name, innerBlocks, attributes, ...rest } = block;

		const newAttributes = { ...attributes };

		for ( const [ key, value ] of Object.entries( attributes ) ) {
			const schema = getBlockAttributeSchema( name, key );

			if ( schema ) {
				newAttributes[ key ] = deserializeAttributeValue(
					schema,
					value
				);
			}
		}

		return {
			...rest,
			name,
			attributes: newAttributes,
			innerBlocks: deserializeBlockAttributes( innerBlocks ?? [] ),
		};
	} );
}

/**
 * @param {any}   gblock
 * @param {Y.Map} yblock
 */
function areBlocksEqual( gblock: Block, yblock: YBlock ): boolean {
	const yblockAsJson = yblock.toJSON();

	// we must not sync clientId, as this can't be generated consistently and
	// hence will lead to merge conflicts.
	const overwrites = {
		innerBlocks: null,
		clientId: null,
	};
	const res = fastDeepEqual(
		Object.assign( {}, gblock, overwrites ),
		Object.assign( {}, yblockAsJson, overwrites )
	);
	const inners = gblock.innerBlocks || [];
	const yinners = yblock.get( 'innerBlocks' );
	return (
		res &&
		inners.length === yinners?.length &&
		inners.every( ( block: Block, i: number ) =>
			areBlocksEqual( block, yinners.get( i ) )
		)
	);
}

function createNewYAttributeMap(
	blockName: string,
	attributes: BlockAttributes
): YBlockAttributes {
	return new Y.Map(
		Object.entries( attributes ).map(
			( [ attributeName, attributeValue ] ) => {
				return [
					attributeName,
					createNewYAttributeValue(
						blockName,
						attributeName,
						attributeValue
					),
				];
			}
		)
	);
}

function createNewYAttributeValue(
	blockName: string,
	attributeName: string,
	attributeValue: unknown
): Y.Text | Y.Array< unknown > | Y.Map< unknown > | unknown {
	const schema = getBlockAttributeSchema( blockName, attributeName );
	return createYValueFromSchema( schema, attributeValue );
}

/**
 * Recursively create the appropriate Y.js type for a value based on its
 * block-attribute schema.
 *
 * - `rich-text`          -> Y.Text
 * - `array`  with query  -> Y.Array of Y.Maps
 * - `object` with query  -> Y.Map
 * - anything else        -> plain value (unchanged)
 *
 * @param schema The attribute type definition.
 * @param value  The plain JS value to convert.
 * @return A Y.js type or the original value.
 */
function createYValueFromSchema(
	schema: BlockAttributeSchema | undefined,
	value: unknown
): Y.Text | Y.Array< unknown > | Y.Map< unknown > | unknown {
	if ( ! schema ) {
		return value;
	}

	if ( schema.type === 'rich-text' ) {
		return new Y.Text( value?.toString() ?? '' );
	}

	if ( schema.type === 'array' && schema.query && Array.isArray( value ) ) {
		const query = schema.query;
		const yArray = new Y.Array< Y.Map< unknown > >();

		yArray.insert(
			0,
			value.map( ( item ) => createYMapFromQuery( query, item ) )
		);

		return yArray;
	}

	if ( schema.type === 'object' && schema.query && isRecord( value ) ) {
		return createYMapFromQuery( schema.query, value );
	}

	return value;
}

/**
 * Type guard that narrows `unknown` to `Record< string, unknown >`.
 *
 * @param value Value to check.
 * @return True if `value` is a non-null, non-array object.
 */
function isRecord( value: unknown ): value is Record< string, unknown > {
	return !! value && typeof value === 'object' && ! Array.isArray( value );
}

/**
 * Create a Y.Map from a plain object, using a query schema to decide which
 * properties should become nested Y.js types (Y.Text, Y.Array, Y.Map).
 *
 * @param query The query schema defining the properties.
 * @param obj   The plain object to convert.
 * @return A Y.Map with typed values.
 */
function createYMapFromQuery(
	query: Record< string, BlockAttributeSchema >,
	obj: unknown
): Y.Map< unknown > {
	if ( ! isRecord( obj ) ) {
		return new Y.Map();
	}

	const entries: [ string, unknown ][] = Object.entries( obj ).map(
		( [ key, val ] ): [ string, unknown ] => {
			const subSchema = query[ key ];
			return [ key, createYValueFromSchema( subSchema, val ) ];
		}
	);

	return new Y.Map( entries );
}

function createNewYBlock( block: Block ): YBlock {
	return createYMap< YBlockRecord >(
		Object.fromEntries(
			Object.entries( block ).map( ( [ key, value ] ) => {
				switch ( key ) {
					case 'attributes': {
						return [
							key,
							createNewYAttributeMap( block.name, value ),
						];
					}

					case 'innerBlocks': {
						const innerBlocks = new Y.Array();

						// If not an array, set to empty Y.Array.
						if ( ! Array.isArray( value ) ) {
							return [ key, innerBlocks ];
						}

						innerBlocks.insert(
							0,
							value.map( ( innerBlock: Block ) =>
								createNewYBlock( innerBlock )
							)
						);

						return [ key, innerBlocks ];
					}

					default:
						return [ key, value ];
				}
			} )
		)
	);
}

/**
 * Merge incoming block data into the local Y.Doc.
 * This function is called to sync local block changes to a shared Y.Doc.
 *
 * @param yblocks         The blocks in the local Y.Doc.
 * @param incomingBlocks  Gutenberg blocks being synced.
 * @param attributeCursor When provided, describes a selection cursor falling within a
 *                        RichText field associated with a specific block and attribute.
 *                        Derived from the changes that produced the blocks.
 * @param options         Optional settings for the merge operation.
 */
export function mergeCrdtBlocks(
	yblocks: YBlocks,
	incomingBlocks: Block[],
	attributeCursor: MergeCursorPosition,
	options: MergeCrdtBlocksOptions = {}
): void {
	const incomingBlocksToSync = getSerializableBlocks( incomingBlocks );

	// This is a rudimentary diff implementation similar to the y-prosemirror diffing
	// approach.
	// A better implementation would also diff the textual content and represent it
	// using a Y.Text type.
	// However, at this time it makes more sense to keep this algorithm generic to
	// support all kinds of block types.
	// Ideally, we ensure that block data structure have a consistent data format.
	// E.g.:
	//   - textual content (using rich-text formatting?) may always be stored under `block.text`
	//   - local information that shouldn't be shared (e.g. clientId or isDragging) is stored under `block.private`
	//
	// @credit Kevin Jahns (dmonad)
	// @link https://github.com/WordPress/gutenberg/pull/68483
	const numOfCommonEntries = Math.min(
		incomingBlocksToSync.length ?? 0,
		yblocks.length
	);

	let left = 0;
	let right = 0;

	// skip equal blocks from left
	for (
		;
		left < numOfCommonEntries &&
		areBlocksEqual( incomingBlocksToSync[ left ], yblocks.get( left ) );
		left++
	) {
		/* nop */
	}

	// skip equal blocks from right
	for (
		;
		right < numOfCommonEntries - left &&
		areBlocksEqual(
			incomingBlocksToSync[ incomingBlocksToSync.length - right - 1 ],
			yblocks.get( yblocks.length - right - 1 )
		);
		right++
	) {
		/* nop */
	}

	const numOfUpdatesNeeded = numOfCommonEntries - left - right;
	const numOfInsertionsNeeded = Math.max(
		0,
		incomingBlocksToSync.length - yblocks.length
	);
	const numOfDeletionsNeeded = Math.max(
		0,
		yblocks.length - incomingBlocksToSync.length
	);

	// updates
	for ( let i = 0; i < numOfUpdatesNeeded; i++, left++ ) {
		const incomingYBlock = incomingBlocksToSync[ left ];
		const localYBlock = yblocks.get( left );

		Object.entries( incomingYBlock ).forEach(
			( [ incomingBlockProperty, incomingBlockPropertyValue ] ) => {
				switch ( incomingBlockProperty ) {
					case 'attributes': {
						const localAttributes = localYBlock.get(
							incomingBlockProperty
						);
						const incomingAttributes = incomingBlockPropertyValue;

						// When the local block has no attributes, adopt the incoming set.
						if ( ! localAttributes ) {
							localYBlock.set(
								incomingBlockProperty,
								createNewYAttributeMap(
									incomingYBlock.name,
									incomingAttributes
								)
							);
							break;
						}

						// Otherwise the attributes need to be merged.
						Object.entries( incomingAttributes ).forEach(
							( [
								incomingAttributeName,
								incomingAttributeValue,
							] ) => {
								const currentAttribute = localAttributes?.get(
									incomingAttributeName
								);

								const isExpectedType = isExpectedAttributeType(
									incomingYBlock.name,
									incomingAttributeName,
									currentAttribute
								);

								// Y types (Y.Text, Y.Array, Y.Map) cannot be
								// compared with fastDeepEqual against plain values.
								// Delegate to mergeYValue which handles no-op
								// detection at the edges.
								const isYType =
									currentAttribute instanceof Y.AbstractType;

								const isAttributeChanged =
									! isExpectedType ||
									isYType ||
									! fastDeepEqual(
										currentAttribute,
										incomingAttributeValue
									);

								if ( isAttributeChanged ) {
									updateYBlockAttribute(
										incomingYBlock.name,
										incomingYBlock.clientId,
										incomingAttributeName,
										incomingAttributeValue,
										localAttributes,
										attributeCursor
									);
								}
							}
						);

						// Delete any attributes that are no longer present.
						localAttributes.forEach(
							( _attrValue: unknown, attrName: string ) => {
								if (
									! incomingBlockPropertyValue.hasOwnProperty(
										attrName
									)
								) {
									localAttributes.delete( attrName );
								}
							}
						);

						break;
					}

					case 'innerBlocks': {
						// Recursively merge innerBlocks
						let yInnerBlocks = localYBlock.get(
							incomingBlockProperty
						);

						if ( ! ( yInnerBlocks instanceof Y.Array ) ) {
							yInnerBlocks = new Y.Array< YBlock >();
							localYBlock.set(
								incomingBlockProperty,
								yInnerBlocks
							);
						}

						mergeCrdtBlocks(
							yInnerBlocks,
							incomingBlockPropertyValue ?? [],
							attributeCursor,
							options
						);
						break;
					}

					case 'clientId': {
						// Code Editor changes reparse raw HTML on every
						// keystroke and regenerate fresh clientIds. Keep Y.Doc
						// clientIds stable for the code editor so peers do not
						// remount unchanged blocks on every edit.
						if ( options.preserveClientIds ) {
							break;
						}

						// Otherwise, accept new clientIds from updates
						if (
							incomingBlockPropertyValue !==
							localYBlock.get( incomingBlockProperty )
						) {
							localYBlock.set(
								incomingBlockProperty,
								incomingBlockPropertyValue
							);
						}
						break;
					}

					default:
						if (
							! fastDeepEqual(
								incomingYBlock[ incomingBlockProperty ],
								localYBlock.get( incomingBlockProperty )
							)
						) {
							localYBlock.set(
								incomingBlockProperty,
								incomingBlockPropertyValue
							);
						}
				}
			}
		);
		localYBlock.forEach( ( _v, k ) => {
			if ( ! incomingYBlock.hasOwnProperty( k ) ) {
				localYBlock.delete( k );
			}
		} );
	}

	// deletes
	yblocks.delete( left, numOfDeletionsNeeded );

	// inserts
	for ( let i = 0; i < numOfInsertionsNeeded; i++, left++ ) {
		const newBlock = [ createNewYBlock( incomingBlocksToSync[ left ] ) ];

		yblocks.insert( left, newBlock );
	}

	deduplicateClientIds( yblocks );
}

/**
 * Serializable copies of a block list, cached per list so repeated merges of
 * the same list do not redo the work.
 *
 * @param blocks Blocks as the block editor holds them.
 * @return Blocks without unserializable properties.
 */
function getSerializableBlocks( blocks: Block[] ): Block[] {
	let serializable = serializableBlocksCache.get( blocks );

	if ( ! serializable ) {
		serializable = makeBlocksSerializable( blocks );
		serializableBlocksCache.set( blocks, serializable );
	}

	return serializable;
}

/**
 * Give every block in the Y.Array a distinct client ID.
 *
 * @param yblocks The block list to fix up.
 */
function deduplicateClientIds( yblocks: YBlocks ): void {
	const knownClientIds = new Set< string >();
	for ( let j = 0; j < yblocks.length; j++ ) {
		const yblock: YBlock = yblocks.get( j );

		let clientId = yblock.get( 'clientId' );

		if ( ! clientId ) {
			continue;
		}

		if ( knownClientIds.has( clientId ) ) {
			clientId = uuidv4();
			yblock.set( 'clientId', clientId );
		}
		knownClientIds.add( clientId );
	}
}

/**
 * Rebase the editor's own change onto the live block list.
 *
 * `mergeCrdtBlocks` reconciles the editor's whole block list against the
 * Y.Array by position. That is correct only when the list derives from the
 * Y.Array's current state. The block editor renders a remote change
 * asynchronously, so a keystroke made while a remote update is still on its
 * way to it sends a list that lacks the update, and a positional merge then
 * deletes the peer's block, or reverts the peer's text.
 *
 * Given the list the change was made against (`previousBlocks`), this
 * function applies only the difference between the previous and the incoming
 * list, matching blocks by client ID. Blocks the editor has never seen stay
 * untouched, and a rich-text edit is transformed over the text peers added to
 * the same field since. It falls back to the positional merge when there is
 * no previous blocks, IDs are ambiguous, or freshly parsed IDs describe exactly
 * the same content as the document.
 *
 * @param yblocks         The blocks in the local Y.Doc.
 * @param previousBlocks  The blocks the editor held before the change,
 *                        where the caller knows them.
 * @param incomingBlocks  The blocks the editor holds after the change.
 * @param attributeCursor See `mergeCrdtBlocks`.
 * @return The merged blocks when they differ from the incoming edit.
 */
export function rebaseCrdtBlocks(
	yblocks: YBlocks,
	previousBlocks: Block[] | undefined,
	incomingBlocks: Block[],
	attributeCursor: MergeCursorPosition
): Block[] | undefined {
	if ( ! previousBlocks ) {
		mergeCrdtBlocks( yblocks, incomingBlocks, attributeCursor );
		return;
	}

	rebaseBlockList( yblocks, previousBlocks, incomingBlocks, attributeCursor );

	const merged = yblocks.toJSON() as Block[];
	return fastDeepEqual( merged, getSerializableBlocks( incomingBlocks ) )
		? undefined
		: deserializeBlockAttributes( merged );
}

/**
 * The body of `rebaseCrdtBlocks`, shared with the inner block lists.
 *
 * @param yblocks         The blocks in the local Y.Doc.
 * @param previousBlocks  The blocks the editor held before the change.
 * @param incomingBlocks  The blocks the editor holds after the change.
 * @param attributeCursor See `mergeCrdtBlocks`.
 */
function rebaseBlockList(
	yblocks: YBlocks,
	previousBlocks: Block[],
	incomingBlocks: Block[],
	attributeCursor: MergeCursorPosition
): void {
	if ( previousBlocks === incomingBlocks ) {
		return;
	}

	const previous = getSerializableBlocks( previousBlocks );
	const incoming = getSerializableBlocks( incomingBlocks );

	// A plain-array mirror of the Y.Array, kept in step with every structural
	// change below, so positions come from a map instead of a scan of the
	// Y.Array for each block.
	const order = yblocks.toArray();
	const yBlocksById = indexYBlocksByClientId( order );
	let positions: Map< YBlock, number > | null = null;
	const indexOf = ( yblock: YBlock ): number => {
		if ( ! positions ) {
			positions = new Map( order.map( ( entry, i ) => [ entry, i ] ) );
		}
		return positions.get( yblock ) ?? -1;
	};
	const deleteAt = ( index: number ): void => {
		yblocks.delete( index, 1 );
		order.splice( index, 1 );
		positions = null;
	};
	const insertAt = ( index: number, yblock: YBlock ): void => {
		yblocks.insert( index, [ yblock ] );
		order.splice( index, 0, yblock );
		positions = null;
	};

	// Missing IDs can mean a peer replaced every block. Only use positional
	// matching for freshly parsed IDs when all previous blocks still match
	// the document's content. An empty previous list is a valid empty document.
	const canRebase =
		yBlocksById !== null &&
		hasDistinctClientIds( previous ) &&
		hasDistinctClientIds( incoming );

	if (
		! canRebase ||
		( previous.length > 0 &&
			previous.length === order.length &&
			! previous.some( ( block ) =>
				yBlocksById.has( block.clientId as string )
			) &&
			previous.every( ( block, index ) =>
				areBlocksEqual( block, order[ index ] )
			) )
	) {
		mergeCrdtBlocks( yblocks, incomingBlocks, attributeCursor );
		return;
	}

	const previousBlocksById = new Map(
		previous.map( ( block ) => [ block.clientId as string, block ] )
	);
	const incomingIds = new Set(
		incoming.map( ( block ) => block.clientId as string )
	);

	// Deletions: blocks the editor had and no longer has. Deleting from the
	// end keeps the lower indexes valid.
	const deletedIndexes: number[] = [];
	for ( const block of previous ) {
		const clientId = block.clientId as string;
		if ( incomingIds.has( clientId ) ) {
			continue;
		}
		const yblock = yBlocksById.get( clientId );
		const index = yblock ? indexOf( yblock ) : -1;
		if ( index !== -1 ) {
			deletedIndexes.push( index );
		}
		yBlocksById.delete( clientId );
	}
	deletedIndexes.sort( ( a, b ) => b - a );
	for ( const index of deletedIndexes ) {
		deleteAt( index );
	}

	// Updates and insertions, in the editor's order. A new block goes right
	// after the nearest preceding block the editor and the document share.
	incoming.forEach( ( block, i ) => {
		const clientId = block.clientId as string;
		const existing = yBlocksById.get( clientId );

		const previousBlock = previousBlocksById.get( clientId );

		if ( existing ) {
			rebaseYBlock(
				existing,
				previousBlock ?? ( existing.toJSON() as unknown as Block ),
				block,
				attributeCursor
			);
			return;
		}

		// A previous block the document no longer has was deleted by a peer.
		// It stays deleted unless the editor changed it since; then the edit
		// wins and the block is re-created.
		if ( previousBlock && fastDeepEqual( previousBlock, block ) ) {
			return;
		}

		let insertIndex = 0;
		for ( let j = i - 1; j >= 0; j-- ) {
			const previousSibling = yBlocksById.get(
				incoming[ j ].clientId as string
			);
			if ( previousSibling ) {
				insertIndex = indexOf( previousSibling ) + 1;
				break;
			}
		}

		const newYBlock = createNewYBlock( block );
		insertAt( insertIndex, newYBlock );
		yBlocksById.set( clientId, newYBlock );
	} );

	// Only restore order when the editor reordered surviving previous blocks.
	// A text edit must not undo a peer's move.
	const previousOrder = previous
		.filter( ( block ) => incomingIds.has( block.clientId as string ) )
		.map( ( block ) => block.clientId );
	const incomingOrder = incoming
		.filter( ( block ) =>
			previousBlocksById.has( block.clientId as string )
		)
		.map( ( block ) => block.clientId );
	if ( fastDeepEqual( previousOrder, incomingOrder ) ) {
		return;
	}

	let previousIndex = -1;
	for ( const block of incoming ) {
		const yblock = yBlocksById.get( block.clientId as string );
		if ( ! yblock ) {
			continue;
		}
		let index = indexOf( yblock );
		if ( index < previousIndex ) {
			const moved = createNewYBlock(
				yblock.toJSON() as unknown as Block
			);
			deleteAt( index );
			// The deletion shifted the previous block down by one, so this
			// index is right after it.
			insertAt( previousIndex, moved );
			yBlocksById.set( block.clientId as string, moved );
			index = previousIndex;
		}
		previousIndex = index;
	}

	deduplicateClientIds( yblocks );
}

/**
 * Index a block list by client ID.
 *
 * @param yblocks The blocks of a Y.Array.
 * @return The index, or null when a block has no client ID or two share one.
 */
function indexYBlocksByClientId(
	yblocks: YBlock[]
): Map< string, YBlock > | null {
	const byClientId = new Map< string, YBlock >();
	for ( const yblock of yblocks ) {
		const clientId = yblock.get( 'clientId' );
		if ( ! clientId || byClientId.has( clientId ) ) {
			return null;
		}
		byClientId.set( clientId, yblock );
	}
	return byClientId;
}

function hasDistinctClientIds( blocks: Block[] ): boolean {
	const clientIds = new Set< string >();
	for ( const block of blocks ) {
		if ( ! block.clientId || clientIds.has( block.clientId ) ) {
			return false;
		}
		clientIds.add( block.clientId );
	}
	return true;
}

const BLOCK_STRUCTURE_KEYS = new Set( [
	'attributes',
	'innerBlocks',
	'clientId',
] );

/**
 * Apply the change from `previousBlock` to `block` onto a Y.Map block the editor knows.
 *
 * @param yblock          The block in the Y.Doc.
 * @param previousBlock   The block as the editor rendered it before the change.
 * @param block           The block after the change.
 * @param attributeCursor See `mergeCrdtBlocks`.
 */
function rebaseYBlock(
	yblock: YBlock,
	previousBlock: Block,
	block: Block,
	attributeCursor: MergeCursorPosition
): void {
	const yAttributes = yblock.get( 'attributes' );
	const previousAttributes = previousBlock.attributes ?? {};
	const attributes = block.attributes ?? {};

	if ( ! ( yAttributes instanceof Y.Map ) ) {
		yblock.set(
			'attributes',
			createNewYAttributeMap( block.name, attributes )
		);
	} else {
		for ( const [ name, value ] of Object.entries( attributes ) ) {
			const unchanged =
				Object.prototype.hasOwnProperty.call(
					previousAttributes,
					name
				) && fastDeepEqual( previousAttributes[ name ], value );
			if ( unchanged ) {
				continue;
			}
			rebaseYBlockAttribute(
				block.name,
				block.clientId,
				name,
				previousAttributes[ name ],
				value,
				yAttributes,
				attributeCursor
			);
		}

		// Attributes the editor removed. Ones it never had, such as an
		// attribute a peer added since, are left alone.
		for ( const name of Object.keys( previousAttributes ) ) {
			if (
				! Object.prototype.hasOwnProperty.call( attributes, name ) &&
				yAttributes.has( name )
			) {
				yAttributes.delete( name );
			}
		}
	}

	const yInnerBlocks = yblock.get( 'innerBlocks' );
	const innerBlocks = block.innerBlocks ?? [];
	if ( yInnerBlocks instanceof Y.Array ) {
		rebaseBlockList(
			yInnerBlocks,
			previousBlock.innerBlocks ?? [],
			innerBlocks,
			attributeCursor
		);
	} else if ( innerBlocks.length > 0 ) {
		const created = new Y.Array< YBlock >();
		yblock.set( 'innerBlocks', created );
		mergeCrdtBlocks( created, innerBlocks, attributeCursor );
	}

	const previousRecord = previousBlock as unknown as Record<
		string,
		unknown
	>;
	const record = block as unknown as Record< string, unknown >;
	for ( const key of Object.keys( record ) ) {
		if ( BLOCK_STRUCTURE_KEYS.has( key ) ) {
			continue;
		}
		if ( ! fastDeepEqual( previousRecord[ key ], record[ key ] ) ) {
			yblock.set( key, record[ key ] );
		}
	}
	for ( const key of Object.keys( previousRecord ) ) {
		if ( BLOCK_STRUCTURE_KEYS.has( key ) ) {
			continue;
		}
		if (
			! Object.prototype.hasOwnProperty.call( record, key ) &&
			yblock.has( key )
		) {
			yblock.delete( key );
		}
	}
}

/**
 * Apply one changed attribute. A rich-text edit is rebased over concurrent
 * edits to the same text; every other attribute takes the editor's value.
 *
 * @param blockName       The block's name, used to look up the attribute schema.
 * @param clientId        The block's client ID, used to scope the cursor hint.
 * @param attributeName   The attribute to update.
 * @param previousValue   The attribute's value as the editor rendered it before the change.
 * @param attributeValue  The attribute's value after the change.
 * @param yAttributes     The block's attributes in the Y.Doc.
 * @param attributeCursor See `mergeCrdtBlocks`.
 */
function rebaseYBlockAttribute(
	blockName: string,
	clientId: string | undefined,
	attributeName: string,
	previousValue: unknown,
	attributeValue: unknown,
	yAttributes: YBlockAttributes,
	attributeCursor: MergeCursorPosition
): void {
	const schema = getBlockAttributeSchema( blockName, attributeName );
	const currentValue = yAttributes.get( attributeName );

	if (
		schema?.type === 'rich-text' &&
		typeof attributeValue === 'string' &&
		typeof previousValue === 'string' &&
		currentValue instanceof Y.Text
	) {
		rebaseRichTextUpdate(
			currentValue,
			previousValue,
			attributeValue,
			resolveRichTextCursorPosition(
				attributeCursor,
				{ attributeKey: attributeName, clientId },
				attributeValue
			)
		);
		return;
	}

	updateYBlockAttribute(
		blockName,
		clientId,
		attributeName,
		attributeValue,
		yAttributes,
		attributeCursor
	);
}

/**
 * Apply the edit from `previousValue` to `updatedValue` onto a Y.Text that
 * may have moved on since the editor read `previousValue`.
 *
 * The editor's edit is computed as a delta against the previous value, the peers'
 * edits as a delta from the previous value to the current text, and the first is
 * transformed over the second so both survive. When the text has not moved,
 * this is the ordinary cursor-aware merge.
 *
 * @param blockYText      The Y.Text to update.
 * @param previousValue   The value the editor rendered before the edit.
 * @param updatedValue    The value after the edit.
 * @param htmlCursorIndex The cursor index in the updated HTML string.
 */
export function rebaseRichTextUpdate(
	blockYText: Y.Text,
	previousValue: string,
	updatedValue: string,
	htmlCursorIndex: HtmlStringIndex | null = null
): void {
	const currentValue = blockYText.toString();

	if ( currentValue === previousValue ) {
		mergeRichTextUpdate( blockYText, updatedValue, htmlCursorIndex );
		return;
	}

	const previousDelta = new Delta().insert( previousValue );
	const updatedDelta = new Delta().insert( updatedValue );
	const cursorDiff = previousDelta.diffWithCursor(
		updatedDelta,
		htmlCursorIndex
	);

	// `diffWithCursor()` can produce a corrupt diff in some cases (see
	// `mergeRichTextUpdate`). Check it against the previous value, which is the
	// text it was computed from, and fall back to the plain diff otherwise.
	const localDiff =
		htmlCursorIndex === null ||
		deltaToString( previousDelta.compose( cursorDiff ) ) === updatedValue
			? cursorDiff
			: previousDelta.diff( updatedDelta );

	const remoteDiff = previousDelta.diff( new Delta().insert( currentValue ) );

	// Treat the peers' edits as having happened first.
	const rebasedDiff = remoteDiff.transform( localDiff, true );

	blockYText.applyDelta( rebasedDiff.ops );
}

function deltaToString( delta: Delta ): string {
	return delta.ops
		.map( ( op ) => ( typeof op.insert === 'string' ? op.insert : '' ) )
		.join( '' );
}

/**
 * Compare a plain array element against a Y.Map element for equality.
 * Used by the left-right sweep diff in mergeYArray.
 *
 * @param newElement The plain object from the incoming array.
 * @param yElement   The Y.Map element from the existing Y.Array.
 * @return True if the elements are deeply equal.
 */
function areArrayElementsEqual(
	newElement: unknown,
	yElement: unknown
): boolean {
	if ( yElement instanceof Y.Map && isRecord( newElement ) ) {
		return fastDeepEqual( newElement, yElement.toJSON() );
	}

	return fastDeepEqual( newElement, yElement );
}

/**
 * Merge an incoming plain array into an existing Y.Array in-place.
 *
 * Uses the same left-right sweep diff approach as mergeCrdtBlocks:
 * equal elements are skipped from both ends, then the middle section
 * is updated, deleted, or inserted as needed. This preserves existing
 * Y.Map/Y.Text objects for unchanged elements, so concurrent edits
 * to those elements are not lost.
 *
 * @param yArray         The existing Y.Array to update.
 * @param newValue       The new plain array to merge into the Y.Array.
 * @param schema         The attribute schema (must have `query`).
 * @param cursorPosition The local cursor position for rich-text delta merges.
 * @param cursorScope    The selected block attribute scope for rich-text cursor hints.
 */
function mergeYArray(
	yArray: Y.Array< unknown >,
	newValue: unknown[],
	schema: BlockAttributeSchema,
	cursorPosition: MergeCursorPosition,
	cursorScope: RichTextCursorScope
): void {
	if ( ! schema.query ) {
		return;
	}

	const query = schema.query;
	const numOfCommonEntries = Math.min( newValue.length, yArray.length );

	let left = 0;
	let right = 0;

	// Skip equal elements from left.
	for (
		;
		left < numOfCommonEntries &&
		areArrayElementsEqual( newValue[ left ], yArray.get( left ) );
		left++
	) {
		/* nop */
	}

	// Skip equal elements from right.
	for (
		;
		right < numOfCommonEntries - left &&
		areArrayElementsEqual(
			newValue[ newValue.length - right - 1 ],
			yArray.get( yArray.length - right - 1 )
		);
		right++
	) {
		/* nop */
	}

	// Updates: merge changed elements in-place.
	const numOfUpdatesNeeded = numOfCommonEntries - left - right;

	for ( let i = 0; i < numOfUpdatesNeeded; i++ ) {
		const currentElement = yArray.get( left + i );
		const newElement = newValue[ left + i ];

		if ( currentElement instanceof Y.Map && isRecord( newElement ) ) {
			mergeYMapValues(
				currentElement,
				newElement,
				query,
				cursorPosition,
				cursorScope
			);
		} else {
			// Element is the wrong type (e.g. partial migration) or the
			// incoming value is not an object. Rebuild the entire array.
			yArray.delete( 0, yArray.length );
			yArray.insert(
				0,
				newValue.map( ( item ) => createYMapFromQuery( query, item ) )
			);
			return;
		}
	}

	// Deletes.
	const numOfDeletionsNeeded = Math.max( 0, yArray.length - newValue.length );

	if ( numOfDeletionsNeeded > 0 ) {
		yArray.delete( left + numOfUpdatesNeeded, numOfDeletionsNeeded );
	}

	// Inserts.
	const numOfInsertionsNeeded = Math.max(
		0,
		newValue.length - yArray.length
	);

	if ( numOfInsertionsNeeded > 0 ) {
		const insertAt = left + numOfUpdatesNeeded;
		const itemsToInsert: Y.Map< unknown >[] = new Array(
			numOfInsertionsNeeded
		);

		for ( let i = 0; i < numOfInsertionsNeeded; i++ ) {
			itemsToInsert[ i ] = createYMapFromQuery(
				query,
				newValue[ insertAt + i ]
			);
		}

		yArray.insert( insertAt, itemsToInsert );
	}
}

/**
 * Merge a single value into a Y.Map entry, using the attribute schema to
 * decide how to merge.
 *
 * If the current value is already a matching Y.js type (Y.Text, Y.Array,
 * Y.Map), the update is merged in-place so concurrent edits are preserved.
 * Otherwise the value is replaced wholesale.
 *
 * @param schema         The attribute type definition for this value.
 * @param newVal         The new value to merge into the Y.Map entry.
 * @param yMap           The Y.Map that owns this entry.
 * @param key            The key of this entry in the Y.Map.
 * @param cursorPosition The cursor position for rich-text delta merges from the updated value.
 * @param cursorScope    Indicates a specific block and attribute associated with the editor;
 *                       determines whether the cursor should be updated based on the change.
 */
function mergeYValue(
	schema: BlockAttributeSchema | undefined,
	newVal: unknown,
	yMap: Y.Map< unknown >,
	key: string,
	cursorPosition: MergeCursorPosition,
	cursorScope: RichTextCursorScope
): void {
	const currentVal = yMap.get( key );
	if (
		schema?.type === 'rich-text' &&
		typeof newVal === 'string' &&
		currentVal instanceof Y.Text
	) {
		mergeRichTextUpdate(
			currentVal,
			newVal,
			resolveRichTextCursorPosition( cursorPosition, cursorScope, newVal )
		);
	} else if (
		schema?.type === 'array' &&
		schema.query &&
		Array.isArray( newVal ) &&
		currentVal instanceof Y.Array
	) {
		mergeYArray( currentVal, newVal, schema, cursorPosition, cursorScope );
	} else if (
		schema?.type === 'object' &&
		schema.query &&
		isRecord( newVal ) &&
		currentVal instanceof Y.Map
	) {
		mergeYMapValues(
			currentVal,
			newVal,
			schema.query,
			cursorPosition,
			cursorScope
		);
	} else {
		const newYValue = createYValueFromSchema( schema, newVal );

		// If createYValueFromSchema wrapped the value into a Y type, the
		// current value is the wrong type and needs upgrading. Otherwise,
		// only replace if the raw value actually changed.
		if ( newYValue !== newVal || ! fastDeepEqual( currentVal, newVal ) ) {
			yMap.set( key, newYValue );
		}
	}
}

/**
 * Merge an incoming plain object into an existing Y.Map in-place, using
 * the query schema to decide how each property should be merged.
 *
 * Properties present in the Y.Map but absent from `newObj` are deleted.
 *
 * @param yMap           The existing Y.Map to update.
 * @param newObj         The new plain object to merge into the Y.Map.
 * @param query          The query schema defining property types.
 * @param cursorPosition The local cursor position for rich-text delta merges.
 * @param cursorScope    The selected block attribute scope for rich-text cursor hints.
 */
function mergeYMapValues(
	yMap: Y.Map< unknown >,
	newObj: Record< string, unknown >,
	query: Record< string, BlockAttributeSchema >,
	cursorPosition: MergeCursorPosition,
	cursorScope: RichTextCursorScope
): void {
	for ( const [ key, newVal ] of Object.entries( newObj ) ) {
		mergeYValue(
			query[ key ],
			newVal,
			yMap,
			key,
			cursorPosition,
			cursorScope
		);
	}

	// Delete properties absent from the incoming object.
	for ( const key of yMap.keys() ) {
		if ( ! Object.hasOwn( newObj, key ) ) {
			yMap.delete( key );
		}
	}
}

/**
 * Update a single attribute on a Yjs block attributes map (currentAttributes).
 *
 * @param blockName         The block type name, e.g. 'core/paragraph'.
 * @param clientId          The local clientId for the block being merged.
 * @param attributeName     The name of the attribute to update, e.g. 'content'.
 * @param attributeValue    The new value for the attribute.
 * @param currentAttributes The Y.Map holding the block's current attributes.
 * @param newCursorPosition The cursor position for rich-text delta merges from the updated value.
 *                          Notably, this may not correspond to the attribute being edited and is
 *                          used to determine if any cursors need shifting in response to the change.
 */
function updateYBlockAttribute(
	blockName: string,
	clientId: string | undefined,
	attributeName: string,
	attributeValue: unknown,
	currentAttributes: YBlockAttributes,
	newCursorPosition: MergeCursorPosition
): void {
	const schema = getBlockAttributeSchema( blockName, attributeName );

	/*
	 * @todo There is a slight discrepancy between the attribute name and key, which might
	 *       show up when working with multiline RichText instances (of which there are no
	 *       more within Core). For those instances, a cursor might never be updated in
	 *       response to changes because its `attributeKey` won’t match any of the block’s
	 *       attribute names, and since updating this attribute is based on the block names,
	 *       no suitable key for the cursor scope will be created. To fix, the updating code
	 *       would need to parse multiline attributes and infer the `attributeKey` being updated.
	 */
	mergeYValue(
		schema,
		attributeValue,
		currentAttributes,
		attributeName,
		newCursorPosition,
		{ attributeKey: attributeName, clientId }
	);
}

/**
 * References the specific block and attribute associated with a RichText component.
 *
 * This is used to associate a cursor with the attribute it’s editing.
 *
 * @see WPBlockSelection
 */
interface RichTextCursorScope {
	attributeKey: string;
	clientId: string | undefined;
}

interface DeltaWithOps {
	ops: Parameters< Y.Text[ 'applyDelta' ] >[ 0 ];
}

/**
 * When the provided cursor falls within the given block and attribute’s scope,
 * returns an index into the RichText’s serialized HTML where the cursor falls.
 *
 * The cursor scope constrains resolution to ensure that indices are only reported
 * when a cursor falls within the block and attribute being updated, since the
 * attributes being updated may not always be the ones where a cursor presently falls.
 *
 * Returned index measures JS string lengths, thus is counted in UTF-16 code units
 * and contains the syntax characters making up HTML tags, comments, character
 * references, and other non-plaintext content.
 *
 * @param cursorPosition Description of the cursor in the new value.
 * @param cursorScope    Cursors should only be updated if they fall within this
 *                       specific block and attribute.
 * @param updatedValue   New RichText value potentially containing cursor.
 * @return String length into serialized HTML for RichText instance where cursor falls.
 */
function resolveRichTextCursorPosition(
	cursorPosition: MergeCursorPosition,
	cursorScope: RichTextCursorScope,
	updatedValue: string
): HtmlStringIndex | null {
	return cursorPosition &&
		cursorPosition.clientId === cursorScope.clientId &&
		cursorPosition.attributeKey === cursorScope.attributeKey &&
		'number' === typeof cursorPosition.offset &&
		Number.isInteger( cursorPosition.offset )
		? richTextOffsetToHtmlIndex(
				updatedValue,
				asRichTextOffset( cursorPosition.offset )
			)
		: null;
}

// Cached block attribute types, populated once from getBlockTypes().
let cachedBlockAttributeSchemas: Map<
	string,
	Map< string, BlockAttributeSchema >
>;

/**
 * Get the attribute type definition for a block attribute.
 *
 * @param blockName     The name of the block, e.g. 'core/paragraph'.
 * @param attributeName The name of the attribute, e.g. 'content'.
 * @return The type definition of the attribute.
 */
function getBlockAttributeSchema(
	blockName: string,
	attributeName: string
): BlockAttributeSchema | undefined {
	if ( ! cachedBlockAttributeSchemas ) {
		// Parse the attributes for all blocks once.
		cachedBlockAttributeSchemas = new Map();

		for ( const blockType of getBlockTypes() as BlockType[] ) {
			cachedBlockAttributeSchemas.set(
				blockType.name,
				new Map< string, BlockAttributeSchema >(
					Object.entries( blockType.attributes ?? {} ).map(
						( [ name, definition ] ) => {
							const { role, type, query } = definition;
							return [ name, { role, type, query } ];
						}
					)
				)
			);
		}
	}

	return cachedBlockAttributeSchemas.get( blockName )?.get( attributeName );
}

/**
 * Check if an attribute value is the expected type.
 *
 * @param blockName      The name of the block, e.g. 'core/paragraph'.
 * @param attributeName  The name of the attribute, e.g. 'content'.
 * @param attributeValue The current attribute value.
 * @return True if the attribute type is expected, false otherwise.
 */
function isExpectedAttributeType(
	blockName: string,
	attributeName: string,
	attributeValue: unknown
): boolean {
	const schema = getBlockAttributeSchema( blockName, attributeName );

	if ( schema?.type === 'rich-text' ) {
		return attributeValue instanceof Y.Text;
	}

	if ( schema?.type === 'string' ) {
		return typeof attributeValue === 'string';
	}

	if ( schema?.type === 'array' && schema.query ) {
		return attributeValue instanceof Y.Array;
	}

	if ( schema?.type === 'object' && schema.query ) {
		return attributeValue instanceof Y.Map;
	}

	return true;
}

/**
 * Given a block name and attribute key, return true if the attribute is local
 * and should not be synced.
 *
 * @param blockName     The name of the block, e.g. 'core/image'.
 * @param attributeName The name of the attribute to check, e.g. 'blob'.
 * @return True if the attribute is local, false otherwise.
 */
function isLocalAttribute( blockName: string, attributeName: string ): boolean {
	return (
		'local' === getBlockAttributeSchema( blockName, attributeName )?.role
	);
}

let localDoc: Y.Doc;

/**
 * Given a Y.Text object and an updated string value, diff the new value and
 * apply the delta to the Y.Text.
 *
 * @param blockYText      The Y.Text to update.
 * @param updatedValue    The updated value.
 * @param htmlCursorIndex The cursor index in the updated HTML string.
 */
export function mergeRichTextUpdate(
	blockYText: Y.Text,
	updatedValue: string,
	htmlCursorIndex: HtmlStringIndex | null = null
): void {
	// Gutenberg does not use Yjs shared types natively, so we can only subscribe
	// to changes from store and apply them to Yjs types that we create and
	// manage. Crucially, for rich-text attributes, we do not receive granular
	// string updates; we get the new full string value on each change, even when
	// only a single character changed.
	//
	// The code below allows us to compute a delta between the current and new
	// value, then apply it to the Y.Text.

	const currentValueAsDelta = new Delta( blockYText.toDelta() );
	const updatedValueAsDelta = new Delta( [ { insert: updatedValue } ] );
	const deltaDiff = currentValueAsDelta.diffWithCursor(
		updatedValueAsDelta,
		htmlCursorIndex
	);

	/**
	 * When there is no cursor involved, or when the diff is able to shuffle properly
	 * around the cursor then apply that already-computed diff.
	 *
	 * However, `diffWithCursor()` currently fails in certain cases, producing corrupted
	 * output. In these cases, fall back to the raw diff as that will apply cleanly,
	 * even if it provides a less meaningful diff.
	 *
	 * @see Delta.diffWithCursor()
	 */
	const safeDiff =
		htmlCursorIndex === null ||
		isDeltaVerificationMatch( blockYText, deltaDiff, updatedValue )
			? deltaDiff
			: currentValueAsDelta.diff( updatedValueAsDelta );

	blockYText.applyDelta( safeDiff.ops );
}

/**
 * Verify that applying a delta to an existing Y.Text object produces the expected
 * output string.
 *
 * A stale, mis-scoped, or corrupted Delta will mutate a text value to the wrong
 * output string. This function applies the given Delta and indicates whether it
 * produces the given expected output string value.
 *
 * @param blockYText    The current Y.Text before applying the candidate delta.
 * @param delta         The candidate delta.
 * @param expectedValue The exact string expected after applying the delta.
 * @return Whether the candidate delta produces the expected value.
 */
function isDeltaVerificationMatch(
	blockYText: Y.Text,
	delta: DeltaWithOps,
	expectedValue: string
): boolean {
	if ( ! localDoc ) {
		// Y.Text must be attached to a Y.Doc to be able to do operations on it.
		// Create a temporary Y.Text attached to a local Y.Doc for delta computation.
		// This is an optimization to avoid creating a new Y.Doc on every update.
		localDoc = new Y.Doc();
	}

	const verificationYText = localDoc.getText( 'verification-text' );

	// Because this is global, it must be cleared before using.
	verificationYText.delete( 0, verificationYText.length );
	verificationYText.insert( 0, blockYText.toString() );
	verificationYText.applyDelta( delta.ops );

	return verificationYText.toString() === expectedValue;
}
