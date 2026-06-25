/**
 * External dependencies
 */
import { v4 as uuidv4 } from 'uuid';
import fastDeepEqual from 'fast-deep-equal/es6/index.js';

/**
 * WordPress dependencies
 */
import { getBlockTypes } from '@wordpress/blocks';
import { RichTextData } from '@wordpress/rich-text';
import { Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
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
	baseBlocks?: Block[];
	preserveClientIds?: boolean;
}

type MergeCrdtBlocksArgument = MergeCrdtBlocksOptions | Block[];

function normalizeMergeCrdtBlocksOptions(
	options: MergeCrdtBlocksArgument = {}
): MergeCrdtBlocksOptions {
	return Array.isArray( options ) ? { baseBlocks: options } : options;
}

/**
 * Optional description of where a cursor falls.
 *
 * Used to coordinate shifting of cursor when applying changes
 * to a Y.Doc with RichText instances.
 */
export type MergeCursorPosition = WPBlockSelection | null;

const ARRAY_ELEMENT_ID_KEY = '__unstableSyncId';
const ARRAY_ELEMENT_ID_SYMBOL = Symbol( 'wpSyncArrayElementId' );

const serializableBlocksCache = new WeakMap< WeakKey, Block[] >();
const previousLocalBlocksCache = new WeakMap< YBlocks, Block[] >();

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
		const arrayElementId = getArrayElementId( value );

		for ( const [ k, v ] of Object.entries( value ) ) {
			if ( k === ARRAY_ELEMENT_ID_KEY ) {
				continue;
			}

			result[ k ] = serializeAttributeValue( v );
		}

		if ( arrayElementId ) {
			result[ ARRAY_ELEMENT_ID_KEY ] = arrayElementId;
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
		const arrayElementId = getArrayElementId( value );

		for ( const [ key, innerValue ] of Object.entries(
			value as Record< string, unknown >
		) ) {
			if ( key === ARRAY_ELEMENT_ID_KEY ) {
				continue;
			}

			result[ key ] = deserializeAttributeValue(
				schema?.query?.[ key ],
				innerValue
			);
		}

		if ( arrayElementId ) {
			defineArrayElementId( result, arrayElementId );
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
	return createYValueFromSchema( schema, attributeValue, attributeName );
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
 * @param schema    The attribute type definition.
 * @param value     The plain JS value to convert.
 * @param valuePath Optional path used to identify array elements.
 * @return A Y.js type or the original value.
 */
function createYValueFromSchema(
	schema: BlockAttributeSchema | undefined,
	value: unknown,
	valuePath?: string
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
			value.map( ( item, index ) =>
				createYMapFromQuery(
					query,
					item,
					valuePath ? `${ valuePath }/${ index }` : true
				)
			)
		);

		return yArray;
	}

	if ( schema.type === 'object' && schema.query && isRecord( value ) ) {
		return createYMapFromQuery( schema.query, value, undefined, valuePath );
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
 * @param query          The query schema defining the properties.
 * @param obj            The plain object to convert.
 * @param arrayElementId Optional stable ID for an array element.
 * @param valuePath      Optional path used to identify nested array elements.
 * @return A Y.Map with typed values.
 */
function createYMapFromQuery(
	query: Record< string, BlockAttributeSchema >,
	obj: unknown,
	arrayElementId?: string | true,
	valuePath?: string
): Y.Map< unknown > {
	if ( ! isRecord( obj ) ) {
		return new Y.Map();
	}

	const nestedValuePath =
		valuePath ??
		( typeof arrayElementId === 'string' ? arrayElementId : undefined );
	const entries: [ string, unknown ][] = Object.entries( obj )
		.filter( ( [ key ] ) => key !== ARRAY_ELEMENT_ID_KEY )
		.map( ( [ key, val ] ): [ string, unknown ] => {
			const subSchema = query[ key ];
			return [
				key,
				createYValueFromSchema(
					subSchema,
					val,
					nestedValuePath ? `${ nestedValuePath }/${ key }` : key
				),
			];
		} );

	const resolvedArrayElementId =
		getArrayElementId( obj ) ??
		( arrayElementId === true ? uuidv4() : arrayElementId );

	if ( resolvedArrayElementId ) {
		entries.push( [ ARRAY_ELEMENT_ID_KEY, resolvedArrayElementId ] );
	}

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

function getBlockClientId( block: Block ): string | null {
	return block.clientId || null;
}

function getYBlockClientId( yblock: YBlock ): string | null {
	const clientId = yblock.get( 'clientId' );
	return typeof clientId === 'string' && clientId ? clientId : null;
}

function findYBlockIndexByClientId(
	yblocks: YBlocks,
	clientId: string,
	startIndex = 0
): number {
	for ( let index = startIndex; index < yblocks.length; index++ ) {
		if ( getYBlockClientId( yblocks.get( index ) ) === clientId ) {
			return index;
		}
	}

	return -1;
}

function normalizeBlockForIdentity( value: unknown ): unknown {
	if ( Array.isArray( value ) ) {
		return value.map( normalizeBlockForIdentity );
	}

	if ( isRecord( value ) ) {
		return Object.fromEntries(
			Object.entries( value )
				.filter( ( [ key ] ) => key !== 'clientId' )
				.sort( ( [ a ], [ b ] ) => a.localeCompare( b ) )
				.map( ( [ key, innerValue ] ) => [
					key,
					normalizeBlockForIdentity( innerValue ),
				] )
		);
	}

	return value;
}

function getBlockSemanticKey( block: Block ): string {
	return JSON.stringify( normalizeBlockForIdentity( block ) );
}

function isSameBlockIdentity( firstBlock: Block, secondBlock: Block ): boolean {
	const firstClientId = getBlockClientId( firstBlock );
	const secondClientId = getBlockClientId( secondBlock );

	if ( firstClientId || secondClientId ) {
		return firstClientId === secondClientId;
	}

	return (
		getBlockSemanticKey( firstBlock ) === getBlockSemanticKey( secondBlock )
	);
}

function getYBlockSemanticKey( yblock: YBlock ): string {
	return getBlockSemanticKey( yblock.toJSON() as unknown as Block );
}

function findEquivalentYBlockIndex( yblocks: YBlocks, block: Block ): number {
	const clientId = getBlockClientId( block );

	if ( clientId ) {
		for ( let index = 0; index < yblocks.length; index++ ) {
			if ( getYBlockClientId( yblocks.get( index ) ) === clientId ) {
				return index;
			}
		}
	}

	const semanticKey = getBlockSemanticKey( block );
	let matchingSemanticIndex = -1;
	let semanticMatchCount = 0;

	for ( let index = 0; index < yblocks.length; index++ ) {
		const yblock = yblocks.get( index );

		if (
			getYBlockSemanticKey( yblock ) === semanticKey ||
			areBlocksEqual( block, yblock )
		) {
			matchingSemanticIndex = index;
			semanticMatchCount++;
		}
	}

	return semanticMatchCount === 1 ? matchingSemanticIndex : -1;
}

function getUniqueKeys< T >(
	items: T[],
	getKey: ( item: T ) => string | null
): string[] | null {
	const keys: string[] = [];
	const seenKeys = new Set< string >();

	for ( const item of items ) {
		const key = getKey( item );

		if ( ! key || seenKeys.has( key ) ) {
			return null;
		}

		keys.push( key );
		seenKeys.add( key );
	}

	return keys;
}

function getBlockIdentityKeys(
	yblocks: YBlocks,
	baseBlocks: Block[],
	blocksToSync: Block[]
): {
	currentKeys: string[];
	baseKeys: string[];
	incomingKeys: string[];
} | null {
	const currentClientIds = getUniqueKeys(
		yblocks.toArray(),
		getYBlockClientId
	);
	const baseClientIds = getUniqueKeys( baseBlocks, getBlockClientId );
	const incomingClientIds = getUniqueKeys( blocksToSync, getBlockClientId );

	if ( currentClientIds && baseClientIds && incomingClientIds ) {
		const currentSet = new Set( currentClientIds );
		const baseSet = new Set( baseClientIds );

		if (
			currentSet.size === baseSet.size &&
			incomingClientIds.length === baseClientIds.length &&
			baseClientIds.every( ( key ) => currentSet.has( key ) ) &&
			incomingClientIds.every( ( key ) => baseSet.has( key ) )
		) {
			return {
				currentKeys: currentClientIds,
				baseKeys: baseClientIds,
				incomingKeys: incomingClientIds,
			};
		}
	}

	const currentBlocks = yblocks.toArray().map( ( yblock ) => {
		return yblock.toJSON() as unknown as Block;
	} );
	const currentSemanticKeys = getUniqueKeys(
		currentBlocks,
		getBlockSemanticKey
	);
	const baseSemanticKeys = getUniqueKeys( baseBlocks, getBlockSemanticKey );
	const incomingSemanticKeys = getUniqueKeys(
		blocksToSync,
		getBlockSemanticKey
	);

	if (
		! currentSemanticKeys ||
		! baseSemanticKeys ||
		! incomingSemanticKeys
	) {
		return null;
	}

	const currentSet = new Set( currentSemanticKeys );
	const baseSet = new Set( baseSemanticKeys );

	if (
		currentSet.size !== baseSet.size ||
		incomingSemanticKeys.length !== baseSemanticKeys.length ||
		! baseSemanticKeys.every( ( key ) => currentSet.has( key ) ) ||
		! incomingSemanticKeys.every( ( key ) => baseSet.has( key ) )
	) {
		return null;
	}

	return {
		currentKeys: currentSemanticKeys,
		baseKeys: baseSemanticKeys,
		incomingKeys: incomingSemanticKeys,
	};
}

function haveSameBlockClientIds(
	firstBlocks: Block[],
	secondBlocks: Block[]
): boolean {
	return (
		firstBlocks.length === secondBlocks.length &&
		firstBlocks.every( ( block, index ) => {
			const firstClientId = getBlockClientId( block );
			const secondClientId = getBlockClientId( secondBlocks[ index ] );

			return !! firstClientId && firstClientId === secondClientId;
		} )
	);
}

function shouldUseCachedLocalBlocksAsBase(
	blocksToSync: Block[],
	explicitBaseBlocks: Block[] | undefined,
	cachedBaseBlocks: Block[] | undefined,
	attributeCursor: MergeCursorPosition
): cachedBaseBlocks is Block[] {
	return !! (
		explicitBaseBlocks &&
		cachedBaseBlocks &&
		attributeCursor &&
		! fastDeepEqual( blocksToSync, cachedBaseBlocks ) &&
		haveSameBlockClientIds( blocksToSync, cachedBaseBlocks )
	);
}

function getUniqueBlockMapBySemanticKey(
	blocks: Block[]
): Map< string, Block > | null {
	const blockMap = new Map< string, Block >();

	for ( const block of blocks ) {
		const key = getBlockSemanticKey( block );

		if ( blockMap.has( key ) ) {
			return null;
		}

		blockMap.set( key, block );
	}

	return blockMap;
}

function canReorderYBlocksByClientId(
	yblocks: YBlocks,
	blocksToSync: Block[]
): boolean {
	if ( yblocks.length !== blocksToSync.length || yblocks.length < 2 ) {
		return false;
	}

	const incomingClientIds = blocksToSync.map( getBlockClientId );
	const currentClientIds = yblocks.toArray().map( getYBlockClientId );

	if (
		incomingClientIds.some( ( clientId ) => ! clientId ) ||
		currentClientIds.some( ( clientId ) => ! clientId )
	) {
		return false;
	}

	const incomingSet = new Set( incomingClientIds );

	if ( incomingSet.size !== incomingClientIds.length ) {
		return false;
	}

	const currentSet = new Set( currentClientIds );

	return (
		currentSet.size === currentClientIds.length &&
		currentSet.size === incomingSet.size &&
		currentClientIds.every( ( clientId ) => incomingSet.has( clientId ) )
	);
}

function reorderYBlocksByClientId(
	yblocks: YBlocks,
	blocksToSync: Block[]
): void {
	if ( ! canReorderYBlocksByClientId( yblocks, blocksToSync ) ) {
		return;
	}

	for (
		let targetIndex = 0;
		targetIndex < blocksToSync.length;
		targetIndex++
	) {
		const targetClientId = getBlockClientId( blocksToSync[ targetIndex ] );

		if (
			getYBlockClientId( yblocks.get( targetIndex ) ) === targetClientId
		) {
			continue;
		}

		const currentIndex = yblocks
			.toArray()
			.findIndex(
				( yblock ) => getYBlockClientId( yblock ) === targetClientId
			);

		if ( currentIndex === -1 ) {
			return;
		}

		const reorderedBlock = createNewYBlock( blocksToSync[ targetIndex ] );
		yblocks.delete( currentIndex, 1 );
		yblocks.insert( targetIndex, [ reorderedBlock ] );
	}
}

function rebaseYBlocksByClientId(
	yblocks: YBlocks,
	baseBlocks: Block[] | undefined,
	blocksToSync: Block[]
): boolean {
	if ( ! baseBlocks || yblocks.length !== blocksToSync.length ) {
		return false;
	}

	const identityKeys = getBlockIdentityKeys(
		yblocks,
		baseBlocks,
		blocksToSync
	);

	if ( ! identityKeys || identityKeys.baseKeys.length < 2 ) {
		return false;
	}

	const rebasedKeys = [ ...identityKeys.baseKeys ];

	for (
		let targetIndex = 0;
		targetIndex < blocksToSync.length;
		targetIndex++
	) {
		const targetKey = identityKeys.incomingKeys[ targetIndex ];

		if ( rebasedKeys[ targetIndex ] === targetKey ) {
			continue;
		}

		const baseIndex = rebasedKeys.indexOf( targetKey );
		const currentIndex = identityKeys.currentKeys.indexOf( targetKey );

		if ( baseIndex === -1 || currentIndex === -1 ) {
			return false;
		}

		const reorderedBlock = createNewYBlock(
			yblocks.get( currentIndex ).toJSON() as unknown as Block
		);
		yblocks.delete( currentIndex, 1 );
		yblocks.insert( targetIndex, [ reorderedBlock ] );

		identityKeys.currentKeys.splice( currentIndex, 1 );
		identityKeys.currentKeys.splice( targetIndex, 0, targetKey );
		rebasedKeys.splice( baseIndex, 1 );
		rebasedKeys.splice( targetIndex, 0, targetKey );
	}

	return true;
}

function mergeBlockIntoYBlock(
	yblock: YBlock,
	block: Block,
	attributeCursor: MergeCursorPosition,
	options: MergeCrdtBlocksOptions,
	baseBlock?: Block
): void {
	const baseAttributes = baseBlock?.attributes ?? {};

	Object.entries( block ).forEach( ( [ key, value ] ) => {
		switch ( key ) {
			case 'attributes': {
				const currentAttributes = yblock.get( key );

				// If attributes are not set on the yblock, use the new values.
				if ( ! currentAttributes ) {
					yblock.set(
						key,
						createNewYAttributeMap( block.name, value )
					);
					break;
				}

				Object.entries( value ).forEach(
					( [ attributeName, attributeValue ] ) => {
						const currentAttribute =
							currentAttributes?.get( attributeName );

						const isExpectedType = isExpectedAttributeType(
							block.name,
							attributeName,
							currentAttribute
						);

						if (
							baseBlock &&
							isExpectedType &&
							fastDeepEqual(
								baseAttributes[ attributeName ],
								attributeValue
							)
						) {
							return;
						}

						// Y types (Y.Text, Y.Array, Y.Map) cannot be compared
						// with fastDeepEqual against plain values. Delegate to
						// mergeYValue which handles no-op detection at the edges.
						const isYType =
							currentAttribute instanceof Y.AbstractType;

						const isAttributeChanged =
							! isExpectedType ||
							isYType ||
							! fastDeepEqual( currentAttribute, attributeValue );

						if ( isAttributeChanged ) {
							updateYBlockAttribute(
								block.name,
								block.clientId,
								attributeName,
								attributeValue,
								currentAttributes,
								attributeCursor,
								baseAttributes[ attributeName ]
							);
						}
					}
				);

				// Delete any attributes that are no longer present.
				currentAttributes.forEach(
					( _attrValue: unknown, attrName: string ) => {
						if ( ! value.hasOwnProperty( attrName ) ) {
							if (
								baseBlock &&
								! Object.prototype.hasOwnProperty.call(
									baseAttributes,
									attrName
								)
							) {
								return;
							}
							currentAttributes.delete( attrName );
						}
					}
				);

				break;
			}

			case 'innerBlocks': {
				if (
					baseBlock &&
					fastDeepEqual( baseBlock.innerBlocks, value ?? [] )
				) {
					break;
				}

				// Recursively merge innerBlocks.
				let yInnerBlocks = yblock.get( key );

				if ( ! ( yInnerBlocks instanceof Y.Array ) ) {
					yInnerBlocks = new Y.Array< YBlock >();
					yblock.set( key, yInnerBlocks );
				}

				mergeCrdtBlocks( yInnerBlocks, value ?? [], attributeCursor, {
					...options,
					baseBlocks: baseBlock?.innerBlocks,
				} );
				break;
			}

			case 'clientId': {
				if ( options.preserveClientIds ) {
					break;
				}

				if ( baseBlock && fastDeepEqual( baseBlock.clientId, value ) ) {
					break;
				}

				if ( value !== yblock.get( key ) ) {
					yblock.set( key, value );
				}
				break;
			}

			default: {
				const blockKey = key as keyof Block;

				if (
					baseBlock &&
					fastDeepEqual( baseBlock[ blockKey ], value )
				) {
					break;
				}

				if ( ! fastDeepEqual( value, yblock.get( key ) ) ) {
					yblock.set( key, value );
				}
			}
		}
	} );
	yblock.forEach( ( _v, k ) => {
		if ( ! Object.hasOwn( block, k ) ) {
			if (
				baseBlock &&
				! Object.prototype.hasOwnProperty.call( baseBlock, k )
			) {
				return;
			}
			yblock.delete( k );
		}
	} );
}

function mergeYBlocksByClientId(
	yblocks: YBlocks,
	blocksToSync: Block[],
	attributeCursor: MergeCursorPosition,
	options: MergeCrdtBlocksOptions,
	baseBlocks?: Block[]
): void {
	const incomingBlocksByClientId = new Map(
		blocksToSync.map( ( block ) => [ getBlockClientId( block ), block ] )
	);
	const baseBlocksByClientId = new Map(
		( baseBlocks ?? [] ).map( ( block ) => [
			getBlockClientId( block ),
			block,
		] )
	);
	const incomingBlocksBySemanticKey =
		getUniqueBlockMapBySemanticKey( blocksToSync );
	const baseBlocksBySemanticKey = baseBlocks
		? getUniqueBlockMapBySemanticKey( baseBlocks )
		: null;

	for ( let index = 0; index < yblocks.length; index++ ) {
		const yblock = yblocks.get( index );
		const clientId = getYBlockClientId( yblock );
		let block = incomingBlocksByClientId.get( clientId );
		let baseBlock = baseBlocksByClientId.get( clientId );

		if ( ! block && incomingBlocksBySemanticKey ) {
			const semanticKey = getBlockSemanticKey(
				yblock.toJSON() as unknown as Block
			);
			block = incomingBlocksBySemanticKey.get( semanticKey );
			baseBlock = baseBlocksBySemanticKey?.get( semanticKey );
		}

		if ( block ) {
			mergeBlockIntoYBlock(
				yblock,
				block,
				attributeCursor,
				options,
				baseBlock
			);
		}
	}
}

function areYBlocksEqualToPlainBlocks(
	yblocks: YBlocks,
	blocks: Block[]
): boolean {
	return (
		yblocks.length === blocks.length &&
		blocks.every( ( block, index ) =>
			areBlocksEqual( block, yblocks.get( index ) )
		)
	);
}

function findYBlockIndex(
	yblocks: YBlocks,
	baseBlock: Block,
	preferredIndex: number,
	baseLength: number
): number {
	const clientId = getBlockClientId( baseBlock );

	if ( clientId ) {
		for ( let index = 0; index < yblocks.length; index++ ) {
			if ( getYBlockClientId( yblocks.get( index ) ) === clientId ) {
				return index;
			}
		}
	}

	for ( let index = 0; index < yblocks.length; index++ ) {
		if ( areBlocksEqual( baseBlock, yblocks.get( index ) ) ) {
			return index;
		}
	}

	if ( yblocks.length === baseLength && preferredIndex < yblocks.length ) {
		return preferredIndex;
	}

	return preferredIndex < yblocks.length ? preferredIndex : -1;
}

function findStrictYBlockIndex( yblocks: YBlocks, block: Block ): number {
	const clientId = getBlockClientId( block );

	if ( clientId ) {
		for ( let index = 0; index < yblocks.length; index++ ) {
			if ( getYBlockClientId( yblocks.get( index ) ) === clientId ) {
				return index;
			}
		}

		return -1;
	}

	for ( let index = 0; index < yblocks.length; index++ ) {
		if ( areBlocksEqual( block, yblocks.get( index ) ) ) {
			return index;
		}
	}

	return -1;
}

function mergeYBlocksLocalSuffixAppend(
	yblocks: YBlocks,
	blocksToSync: Block[],
	baseBlocks: Block[]
): void {
	if ( blocksToSync.length <= baseBlocks.length || baseBlocks.length === 0 ) {
		return;
	}

	if (
		! fastDeepEqual(
			blocksToSync.slice( 0, baseBlocks.length ),
			baseBlocks
		)
	) {
		return;
	}

	const anchorIndex = findStrictYBlockIndex(
		yblocks,
		baseBlocks[ baseBlocks.length - 1 ]
	);

	if ( anchorIndex === -1 ) {
		return;
	}

	let insertIndex = anchorIndex + 1;

	for ( const block of blocksToSync.slice( baseBlocks.length ) ) {
		const existingIndex = findEquivalentYBlockIndex( yblocks, block );

		if ( existingIndex !== -1 ) {
			insertIndex = Math.max( insertIndex, existingIndex + 1 );
			continue;
		}

		yblocks.insert( insertIndex, [ createNewYBlock( block ) ] );
		insertIndex++;
	}
}

function mergeYBlocksLocalChanges(
	yblocks: YBlocks,
	blocksToSync: Block[],
	baseBlocks: Block[],
	attributeCursor: MergeCursorPosition,
	options: MergeCrdtBlocksOptions
): boolean {
	if ( fastDeepEqual( blocksToSync, baseBlocks ) ) {
		return true;
	}

	if ( areYBlocksEqualToPlainBlocks( yblocks, baseBlocks ) ) {
		return false;
	}

	if (
		yblocks.length === baseBlocks.length &&
		blocksToSync.length === baseBlocks.length
	) {
		return false;
	}

	mergeYBlocksLocalSuffixAppend( yblocks, blocksToSync, baseBlocks );

	const sharedLength = Math.min( baseBlocks.length, blocksToSync.length );

	for ( let index = 0; index < sharedLength; index++ ) {
		const baseBlock = baseBlocks[ index ];
		const block = blocksToSync[ index ];

		if ( ! isSameBlockIdentity( baseBlock, block ) ) {
			return false;
		}

		if ( fastDeepEqual( baseBlock, block ) ) {
			continue;
		}

		const currentIndex = findYBlockIndex(
			yblocks,
			baseBlock,
			index,
			baseBlocks.length
		);

		if ( currentIndex === -1 ) {
			continue;
		}

		mergeBlockIntoYBlock(
			yblocks.get( currentIndex ),
			block,
			attributeCursor,
			options,
			baseBlock
		);
	}

	deleteRemovedLocalBlocks( yblocks, blocksToSync, baseBlocks );
	insertMissingLocalBlocks( yblocks, blocksToSync, baseBlocks, options );

	return true;
}

function deleteRemovedLocalBlocks(
	yblocks: YBlocks,
	blocksToSync: Block[],
	baseBlocks: Block[]
): void {
	const incomingClientIds = new Set(
		blocksToSync
			.map( getBlockClientId )
			.filter( ( clientId ): clientId is string => !! clientId )
	);

	for ( const baseBlock of baseBlocks ) {
		const clientId = getBlockClientId( baseBlock );

		if ( ! clientId || incomingClientIds.has( clientId ) ) {
			continue;
		}

		const currentIndex = findYBlockIndexByClientId( yblocks, clientId );

		if ( currentIndex !== -1 ) {
			yblocks.delete( currentIndex, 1 );
		}
	}
}

function insertMissingLocalBlocks(
	yblocks: YBlocks,
	blocksToSync: Block[],
	baseBlocks: Block[],
	options: MergeCrdtBlocksOptions
): void {
	const baseClientIds = new Set(
		baseBlocks
			.map( getBlockClientId )
			.filter( ( clientId ): clientId is string => !! clientId )
	);
	let insertIndex = 0;
	let hasInsertionAnchor = true;

	for ( const block of blocksToSync ) {
		const clientId = getBlockClientId( block );

		if ( ! clientId ) {
			continue;
		}

		if ( baseClientIds.has( clientId ) ) {
			const matchingIndex = findYBlockIndexByClientId(
				yblocks,
				clientId
			);

			if ( matchingIndex !== -1 ) {
				insertIndex = Math.max( insertIndex, matchingIndex + 1 );
				hasInsertionAnchor = true;
			} else {
				hasInsertionAnchor = false;
			}
			continue;
		}

		const matchingIndex = findYBlockIndexByClientId( yblocks, clientId );

		if ( matchingIndex !== -1 ) {
			mergeBlockIntoYBlock(
				yblocks.get( matchingIndex ),
				block,
				null,
				options
			);
			insertIndex = Math.max( insertIndex, matchingIndex + 1 );
			hasInsertionAnchor = true;
			continue;
		}

		if ( ! hasInsertionAnchor ) {
			continue;
		}

		yblocks.insert( insertIndex, [ createNewYBlock( block ) ] );
		insertIndex++;
	}
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
 * @param options         Optional settings for the merge operation, or a legacy
 *                        pre-change block snapshot used for rebasing.
 */
export function mergeCrdtBlocks(
	yblocks: YBlocks,
	incomingBlocks: Block[],
	attributeCursor: MergeCursorPosition,
	options: MergeCrdtBlocksArgument = {}
): void {
	const mergeOptions = normalizeMergeCrdtBlocksOptions( options );

	// Ensure we are working with serializable block data.
	if ( ! serializableBlocksCache.has( incomingBlocks ) ) {
		serializableBlocksCache.set(
			incomingBlocks,
			makeBlocksSerializable( incomingBlocks )
		);
	}

	const blocksToSync = serializableBlocksCache.get( incomingBlocks ) ?? [];
	const explicitBaseBlocksToSync = mergeOptions.baseBlocks
		? makeBlocksSerializable( mergeOptions.baseBlocks )
		: undefined;
	const cachedBaseBlocksToSync = previousLocalBlocksCache.get( yblocks );
	const useCachedLocalBlocksAsBase = shouldUseCachedLocalBlocksAsBase(
		blocksToSync,
		explicitBaseBlocksToSync,
		cachedBaseBlocksToSync,
		attributeCursor
	);
	const baseBlocksToSync = useCachedLocalBlocksAsBase
		? cachedBaseBlocksToSync
		: explicitBaseBlocksToSync ?? cachedBaseBlocksToSync;

	if (
		baseBlocksToSync &&
		mergeYBlocksLocalChanges(
			yblocks,
			blocksToSync,
			baseBlocksToSync,
			attributeCursor,
			mergeOptions
		)
	) {
		removeDuplicateClientIds( yblocks );
		previousLocalBlocksCache.set( yblocks, blocksToSync );
		return;
	}

	if ( rebaseYBlocksByClientId( yblocks, baseBlocksToSync, blocksToSync ) ) {
		mergeYBlocksByClientId(
			yblocks,
			blocksToSync,
			attributeCursor,
			mergeOptions,
			baseBlocksToSync
		);
		removeDuplicateClientIds( yblocks );
		previousLocalBlocksCache.set( yblocks, blocksToSync );
		return;
	}

	if ( ! baseBlocksToSync ) {
		reorderYBlocksByClientId( yblocks, blocksToSync );
	}

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
		blocksToSync.length ?? 0,
		yblocks.length
	);

	let left = 0;
	let right = 0;

	// skip equal blocks from left
	for (
		;
		left < numOfCommonEntries &&
		areBlocksEqual( blocksToSync[ left ], yblocks.get( left ) );
		left++
	) {
		/* nop */
	}

	// skip equal blocks from right
	for (
		;
		right < numOfCommonEntries - left &&
		areBlocksEqual(
			blocksToSync[ blocksToSync.length - right - 1 ],
			yblocks.get( yblocks.length - right - 1 )
		);
		right++
	) {
		/* nop */
	}

	const numOfUpdatesNeeded = numOfCommonEntries - left - right;
	const numOfInsertionsNeeded = Math.max(
		0,
		blocksToSync.length - yblocks.length
	);
	const numOfDeletionsNeeded = Math.max(
		0,
		yblocks.length - blocksToSync.length
	);

	// updates
	for ( let i = 0; i < numOfUpdatesNeeded; i++, left++ ) {
		const block = blocksToSync[ left ];
		const yblock = yblocks.get( left );

		mergeBlockIntoYBlock(
			yblock,
			block,
			attributeCursor,
			mergeOptions,
			baseBlocksToSync?.[ left ]
		);
	}

	// deletes
	yblocks.delete( left, numOfDeletionsNeeded );

	// inserts
	for ( let i = 0; i < numOfInsertionsNeeded; i++, left++ ) {
		const newBlock = [ createNewYBlock( blocksToSync[ left ] ) ];

		yblocks.insert( left, newBlock );
	}

	removeDuplicateClientIds( yblocks );
	previousLocalBlocksCache.set( yblocks, blocksToSync );
}

function removeDuplicateClientIds( yblocks: YBlocks ): void {
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
		return fastDeepEqual(
			stripArrayElementIds( newElement ),
			stripArrayElementIds( yElement.toJSON() )
		);
	}

	return fastDeepEqual(
		stripArrayElementIds( newElement ),
		stripArrayElementIds( yElement )
	);
}

function getArrayElementId( value: unknown ): string | undefined {
	if ( value instanceof Y.Map ) {
		const id = value.get( ARRAY_ELEMENT_ID_KEY );
		return typeof id === 'string' ? id : undefined;
	}

	if ( isRecord( value ) ) {
		const id = value[ ARRAY_ELEMENT_ID_KEY ];
		if ( typeof id === 'string' ) {
			return id;
		}

		const symbolId = ( value as Record< symbol, unknown > )[
			ARRAY_ELEMENT_ID_SYMBOL
		];
		return typeof symbolId === 'string' ? symbolId : undefined;
	}

	return undefined;
}

function defineArrayElementId(
	value: Record< string, unknown >,
	id: string
): void {
	Object.defineProperty( value, ARRAY_ELEMENT_ID_SYMBOL, {
		configurable: true,
		enumerable: true,
		value: id,
	} );
}

function stripArrayElementIds( value: unknown ): unknown {
	if ( Array.isArray( value ) ) {
		return value.map( stripArrayElementIds );
	}

	if ( isRecord( value ) ) {
		return Object.fromEntries(
			Object.entries( value )
				.filter( ( [ key ] ) => key !== ARRAY_ELEMENT_ID_KEY )
				.map( ( [ key, innerValue ] ) => [
					key,
					stripArrayElementIds( innerValue ),
				] )
		);
	}

	return value;
}

function arePlainValuesEqual( a: unknown, b: unknown ): boolean {
	return fastDeepEqual(
		stripArrayElementIds( a ),
		stripArrayElementIds( b )
	);
}

function isYArrayEqualToPlainArray(
	yArray: Y.Array< unknown >,
	value: unknown[]
): boolean {
	return (
		yArray.length === value.length &&
		value.every( ( element, index ) =>
			areArrayElementsEqual( element, yArray.get( index ) )
		)
	);
}

function hasSharedArrayElementAnchor(
	firstElement: unknown,
	secondElement: unknown
): boolean {
	const firstId = getArrayElementId( firstElement );
	const secondId = getArrayElementId( secondElement );

	if ( firstId && secondId ) {
		return firstId === secondId;
	}

	const firstValue =
		firstElement instanceof Y.Map ? firstElement.toJSON() : firstElement;
	const secondValue =
		secondElement instanceof Y.Map ? secondElement.toJSON() : secondElement;

	if ( arePlainValuesEqual( firstValue, secondValue ) ) {
		return true;
	}

	if ( Array.isArray( firstValue ) && Array.isArray( secondValue ) ) {
		const sharedLength = Math.min( firstValue.length, secondValue.length );

		for ( let index = 0; index < sharedLength; index++ ) {
			if (
				hasSharedArrayElementAnchor(
					firstValue[ index ],
					secondValue[ index ]
				)
			) {
				return true;
			}
		}

		return false;
	}

	if ( isRecord( firstValue ) && isRecord( secondValue ) ) {
		for ( const [ key, value ] of Object.entries( firstValue ) ) {
			if (
				key === ARRAY_ELEMENT_ID_KEY ||
				! Object.hasOwn( secondValue, key )
			) {
				continue;
			}

			if ( hasSharedArrayElementAnchor( value, secondValue[ key ] ) ) {
				return true;
			}
		}
	}

	return false;
}

function findYArrayElementIndex(
	yArray: Y.Array< unknown >,
	previousElement: unknown,
	preferredIndex: number,
	previousLength: number
): number {
	const previousId = getArrayElementId( previousElement );

	if ( previousId ) {
		for ( let i = 0; i < yArray.length; i++ ) {
			if ( getArrayElementId( yArray.get( i ) ) === previousId ) {
				return i;
			}
		}
	}

	for ( let i = 0; i < yArray.length; i++ ) {
		if ( areArrayElementsEqual( previousElement, yArray.get( i ) ) ) {
			return i;
		}
	}

	if ( yArray.length === previousLength && preferredIndex < yArray.length ) {
		return preferredIndex;
	}

	return preferredIndex < yArray.length ? preferredIndex : -1;
}

function mergeYArrayLocalChanges(
	yArray: Y.Array< unknown >,
	newValue: unknown[],
	previousValue: unknown[],
	query: Record< string, BlockAttributeSchema >,
	cursorPosition: MergeCursorPosition,
	cursorScope: RichTextCursorScope
): boolean {
	if ( arePlainValuesEqual( newValue, previousValue ) ) {
		return true;
	}

	// If the current CRDT value still equals the previous local value, use the
	// normal merge path so local inserts/deletes/reorders are applied.
	if ( isYArrayEqualToPlainArray( yArray, previousValue ) ) {
		return false;
	}

	if ( yArray.length === previousValue.length ) {
		return false;
	}

	const sharedLength = Math.min( previousValue.length, newValue.length );

	for ( let i = 0; i < sharedLength; i++ ) {
		const previousElement = previousValue[ i ];
		const newElement = newValue[ i ];

		if ( arePlainValuesEqual( previousElement, newElement ) ) {
			continue;
		}

		const currentIndex = findYArrayElementIndex(
			yArray,
			previousElement,
			i,
			previousValue.length
		);

		if ( currentIndex === -1 ) {
			continue;
		}

		const currentElement = yArray.get( currentIndex );

		if ( currentElement instanceof Y.Map && isRecord( newElement ) ) {
			mergeYMapValues(
				currentElement,
				newElement,
				query,
				cursorPosition,
				appendCursorScopeKey( cursorScope, currentIndex.toString() ),
				isRecord( previousElement ) ? previousElement : undefined
			);
		}
	}

	for ( let i = sharedLength; i < newValue.length; i++ ) {
		const newElement = newValue[ i ];

		if ( i < yArray.length ) {
			const currentElement = yArray.get( i );

			if (
				currentElement instanceof Y.Map &&
				isRecord( newElement ) &&
				hasSharedArrayElementAnchor( currentElement, newElement )
			) {
				mergeYMapValues(
					currentElement,
					newElement,
					query,
					cursorPosition,
					appendCursorScopeKey( cursorScope, i.toString() )
				);
			}

			continue;
		}

		yArray.insert( i, [ createYMapFromQuery( query, newElement, true ) ] );
	}

	return true;
}

function mergeYArrayByElementIds(
	yArray: Y.Array< unknown >,
	newValue: unknown[],
	query: Record< string, BlockAttributeSchema >,
	cursorPosition: MergeCursorPosition,
	cursorScope: RichTextCursorScope
): boolean {
	if ( ! newValue.some( getArrayElementId ) ) {
		return false;
	}

	let index = 0;

	for ( const newElement of newValue ) {
		const newId = getArrayElementId( newElement );
		let currentIndex = -1;

		if ( newId ) {
			for ( let i = index; i < yArray.length; i++ ) {
				if ( getArrayElementId( yArray.get( i ) ) === newId ) {
					currentIndex = i;
					break;
				}
			}
		}

		if ( currentIndex > index ) {
			yArray.delete( index, currentIndex - index );
		}

		if ( currentIndex >= index ) {
			const currentElement = yArray.get( index );
			if ( currentElement instanceof Y.Map && isRecord( newElement ) ) {
				mergeYMapValues(
					currentElement,
					newElement,
					query,
					cursorPosition,
					cursorScope
				);
			}
		} else {
			yArray.insert( index, [
				createYMapFromQuery( query, newElement, true ),
			] );
		}

		index++;
	}

	if ( yArray.length > index ) {
		yArray.delete( index, yArray.length - index );
	}

	return true;
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
 * @param baseValue      Optional pre-change array snapshot used for rebasing.
 */
function mergeYArray(
	yArray: Y.Array< unknown >,
	newValue: unknown[],
	schema: BlockAttributeSchema,
	cursorPosition: MergeCursorPosition,
	cursorScope: RichTextCursorScope,
	baseValue?: unknown
): void {
	if ( ! schema.query ) {
		return;
	}

	const query = schema.query;

	if (
		Array.isArray( baseValue ) &&
		mergeYArrayLocalChanges(
			yArray,
			newValue,
			baseValue,
			query,
			cursorPosition,
			cursorScope
		)
	) {
		return;
	}

	if (
		Array.isArray( baseValue ) &&
		mergeYArrayWithBase(
			yArray,
			newValue,
			schema,
			cursorPosition,
			cursorScope,
			baseValue
		)
	) {
		return;
	}

	if (
		mergeYArrayByElementIds(
			yArray,
			newValue,
			query,
			cursorPosition,
			cursorScope
		)
	) {
		return;
	}

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
				appendCursorScopeKey( cursorScope, ( left + i ).toString() )
			);
		} else {
			// Element is the wrong type (e.g. partial migration) or the
			// incoming value is not an object. Rebuild the entire array.
			yArray.delete( 0, yArray.length );
			yArray.insert(
				0,
				newValue.map( ( item ) =>
					createYMapFromQuery( query, item, true )
				)
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
				newValue[ insertAt + i ],
				true
			);
		}

		yArray.insert( insertAt, itemsToInsert );
	}
}

function mergeYArrayWithBase(
	yArray: Y.Array< unknown >,
	newValue: unknown[],
	schema: BlockAttributeSchema,
	cursorPosition: MergeCursorPosition,
	cursorScope: RichTextCursorScope,
	baseValue: unknown[]
): boolean {
	if ( ! schema.query || yArray.length !== baseValue.length ) {
		return false;
	}

	const query = schema.query;
	const numOfCommonEntries = Math.min( baseValue.length, newValue.length );

	let left = 0;
	let right = 0;

	for (
		;
		left < numOfCommonEntries &&
		arePlainValuesEqual( baseValue[ left ], newValue[ left ] );
		left++
	) {
		/* nop */
	}

	for (
		;
		right < numOfCommonEntries - left &&
		arePlainValuesEqual(
			baseValue[ baseValue.length - right - 1 ],
			newValue[ newValue.length - right - 1 ]
		);
		right++
	) {
		/* nop */
	}

	if ( baseValue.length === newValue.length + 1 ) {
		const preferredDeleteIndex = getPreferredSingleDeleteIndex(
			yArray,
			baseValue,
			newValue
		);

		if ( preferredDeleteIndex !== undefined ) {
			left = preferredDeleteIndex;
			right = baseValue.length - preferredDeleteIndex - 1;
		}
	}

	const deleteCount =
		baseValue.length === newValue.length
			? 0
			: baseValue.length - left - right;
	const insertCount =
		baseValue.length === newValue.length
			? 0
			: newValue.length - left - right;

	if ( deleteCount > 0 ) {
		yArray.delete( left, deleteCount );
	}

	if ( insertCount > 0 ) {
		yArray.insert(
			left,
			newValue
				.slice( left, left + insertCount )
				.map( ( item ) => createYMapFromQuery( query, item, true ) )
		);
	}

	for ( let index = 0; index < newValue.length; index++ ) {
		const isInserted = index >= left && index < left + insertCount;
		let baseIndex: number | undefined;
		if ( ! isInserted ) {
			baseIndex =
				index < left ? index : index - insertCount + deleteCount;
		}
		const newElement = newValue[ index ];

		if (
			baseIndex !== undefined &&
			arePlainValuesEqual( baseValue[ baseIndex ], newElement )
		) {
			continue;
		}

		const currentElement = yArray.get( index );
		if ( currentElement instanceof Y.Map && isRecord( newElement ) ) {
			mergeYMapValues(
				currentElement,
				newElement,
				query,
				cursorPosition,
				cursorScope,
				baseIndex === undefined ? undefined : baseValue[ baseIndex ]
			);
			continue;
		}

		yArray.delete( 0, yArray.length );
		yArray.insert(
			0,
			newValue.map( ( item ) => createYMapFromQuery( query, item, true ) )
		);
		break;
	}

	return true;
}

function getPreferredSingleDeleteIndex(
	yArray: Y.Array< unknown >,
	baseValue: unknown[],
	newValue: unknown[]
): number | undefined {
	let firstCandidate: number | undefined;

	for ( let index = 0; index < baseValue.length; index++ ) {
		const candidateValue = [
			...baseValue.slice( 0, index ),
			...baseValue.slice( index + 1 ),
		];

		if ( ! arePlainValuesEqual( candidateValue, newValue ) ) {
			continue;
		}

		firstCandidate ??= index;

		if (
			areArrayElementsEqual( baseValue[ index ], yArray.get( index ) )
		) {
			return index;
		}
	}

	return firstCandidate;
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
 * @param baseVal        Optional pre-change value used for rebasing.
 */
function mergeYValue(
	schema: BlockAttributeSchema | undefined,
	newVal: unknown,
	yMap: Y.Map< unknown >,
	key: string,
	cursorPosition: MergeCursorPosition,
	cursorScope: RichTextCursorScope,
	baseVal?: unknown
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
		mergeYArray(
			currentVal,
			newVal,
			schema,
			cursorPosition,
			cursorScope,
			baseVal
		);
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
			cursorScope,
			baseVal
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
 * @param baseObj        Optional pre-change object used for rebasing.
 */
function mergeYMapValues(
	yMap: Y.Map< unknown >,
	newObj: Record< string, unknown >,
	query: Record< string, BlockAttributeSchema >,
	cursorPosition: MergeCursorPosition,
	cursorScope: RichTextCursorScope,
	baseObj?: unknown
): void {
	const baseRecord = isRecord( baseObj ) ? baseObj : undefined;

	for ( const [ key, newVal ] of Object.entries( newObj ) ) {
		if (
			baseRecord &&
			Object.hasOwn( baseRecord, key ) &&
			fastDeepEqual( baseRecord[ key ], newVal )
		) {
			continue;
		}

		mergeYValue(
			query[ key ],
			newVal,
			yMap,
			key,
			cursorPosition,
			appendCursorScopeKey( cursorScope, key ),
			baseRecord?.[ key ]
		);
	}

	// Delete properties absent from the incoming object.
	for ( const key of yMap.keys() ) {
		if ( key === ARRAY_ELEMENT_ID_KEY || Object.hasOwn( newObj, key ) ) {
			continue;
		}
		if ( baseRecord && ! Object.hasOwn( baseRecord, key ) ) {
			continue;
		}
		yMap.delete( key );
	}
}

/**
 * Update a single attribute on a Yjs block attributes map (currentAttributes).
 *
 * @param blockName          The block type name, e.g. 'core/paragraph'.
 * @param clientId           The local clientId for the block being merged.
 * @param attributeName      The name of the attribute to update, e.g. 'content'.
 * @param attributeValue     The new value for the attribute.
 * @param currentAttributes  The Y.Map holding the block's current attributes.
 * @param newCursorPosition  The cursor position for rich-text delta merges from the updated value.
 *                           Notably, this may not correspond to the attribute being edited and is
 *                           used to determine if any cursors need shifting in response to the change.
 * @param baseAttributeValue Optional pre-change attribute value used for rebasing.
 */
function updateYBlockAttribute(
	blockName: string,
	clientId: string | undefined,
	attributeName: string,
	attributeValue: unknown,
	currentAttributes: YBlockAttributes,
	newCursorPosition: MergeCursorPosition,
	baseAttributeValue?: unknown
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
		{ attributeKey: attributeName, clientId },
		baseAttributeValue
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

function appendCursorScopeKey(
	cursorScope: RichTextCursorScope,
	key: string
): RichTextCursorScope {
	return {
		...cursorScope,
		attributeKey: `${ cursorScope.attributeKey }.${ key }`,
	};
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
