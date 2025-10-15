/**
 * External dependencies
 */
import { v4 as uuidv4 } from 'uuid';
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { RichTextData } from '@wordpress/rich-text';
import { Y } from '@wordpress/sync';

// @ts-expect-error No exported types.
import { getBlockTypes } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import type { WPBlockSelection } from '../types';

interface BlockAttributes {
	[ key: string ]: unknown;
}

interface BlockType {
	name: string;
	attributes?: Record< string, { type?: string } >;
}

export interface Block {
	attributes: BlockAttributes;
	clientId?: string;
	innerBlocks: Block[];
	originalContent?: string; // unserializable
	validationIssues?: string[]; // unserializable
	name: string;
}

export type YBlock = Y.Map<
	/* name, clientId, and originalContent are strings. */
	| string
	/* validationIssues? is an array of strings. */
	| string[]
	/* attributes is a Y.Map< unknown >. */
	| YBlockAttributes
	/* innerBlocks is a Y.Array< YBlock >. */
	| YBlocks
>;

export type YBlocks = Y.Array< YBlock >;
export type YBlockAttributes = Y.Map< Y.Text | unknown >;

// The Y.Map type is not easy to work with. The generic type it accepts represents
// the possible values of the map, which are varied in our case. This type is
// accurate, but will require aggressive type narrowing when the map values are
// accessed -- or type casting with `as`.
// export type YBlock = Y.Map< Block[ keyof Block ] >;

const serializableBlocksCache = new WeakMap< WeakKey, Block[] >();

function makeBlockAttributesSerializable(
	attributes: BlockAttributes
): BlockAttributes {
	const newAttributes = { ...attributes };
	for ( const [ key, value ] of Object.entries( attributes ) ) {
		if ( value instanceof RichTextData ) {
			newAttributes[ key ] = value.valueOf();
		}
	}
	return newAttributes;
}

function makeBlocksSerializable( blocks: Block[] | YBlocks ): Block[] {
	return blocks.map( ( block: Block | YBlock ) => {
		const blockAsJson = block instanceof Y.Map ? block.toJSON() : block;
		const { name, innerBlocks, attributes, ...rest } = blockAsJson;
		delete rest.validationIssues;
		delete rest.originalContent;
		// delete rest.isValid
		return {
			...rest,
			name,
			attributes: makeBlockAttributesSerializable( attributes ),
			innerBlocks: makeBlocksSerializable( innerBlocks ),
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
	const yinners = yblock.get( 'innerBlocks' ) as YBlocks;
	return (
		res &&
		inners.length === yinners.length &&
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
): Y.Text | unknown {
	const isRichText = isRichTextAttribute( blockName, attributeName );

	if ( isRichText ) {
		return new Y.Text( attributeValue?.toString() ?? '' );
	}

	return attributeValue;
}

function createNewYBlock( block: Block ): YBlock {
	return new Y.Map(
		Object.entries( block ).map( ( [ key, value ] ) => {
			switch ( key ) {
				case 'attributes': {
					return [ key, createNewYAttributeMap( block.name, value ) ];
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
	);
}

/**
 * Merge incoming block data into the local Y.Doc.
 * This function is called to sync local block changes to a shared Y.Doc.
 *
 * @param yblocks        The blocks in the local Y.Doc.
 * @param incomingBlocks Gutenberg blocks being synced, either from a peer or from the local editor.
 * @param lastSelection  The last cursor position, used for hinting the diff algorithm.
 */
export function mergeCrdtBlocks(
	yblocks: YBlocks,
	incomingBlocks: Block[],
	lastSelection: WPBlockSelection | null
): void {
	// Ensure we are working with serializable block data.
	if ( ! serializableBlocksCache.has( incomingBlocks ) ) {
		serializableBlocksCache.set(
			incomingBlocks,
			makeBlocksSerializable( incomingBlocks )
		);
	}
	const allBlocks = serializableBlocksCache.get( incomingBlocks ) ?? [];

	// Ensure we skip blocks that we don't want to sync at the moment
	const blocksToSync = allBlocks.filter( ( block ) =>
		shouldBlockBeSynced( block )
	);

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
		Object.entries( block ).forEach( ( [ key, value ] ) => {
			switch ( key ) {
				case 'attributes': {
					const currentAttributes = yblock.get(
						key
					) as YBlockAttributes;

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
							if (
								fastDeepEqual(
									currentAttributes?.get( attributeName ),
									attributeValue
								)
							) {
								return;
							}

							const isRichText = isRichTextAttribute(
								block.name,
								attributeName
							);

							if (
								isRichText &&
								'string' === typeof attributeValue
							) {
								// Rich text values are stored as persistent Y.Text instances.
								// Update the value with a delta in place.
								const blockYText = currentAttributes.get(
									attributeName
								) as Y.Text;

								mergeRichTextUpdate(
									blockYText,
									attributeValue,
									lastSelection
								);
							} else {
								currentAttributes.set(
									attributeName,
									createNewYAttributeValue(
										block.name,
										attributeName,
										attributeValue
									)
								);
							}
						}
					);

					// Delete any attributes that are no longer present.
					currentAttributes.forEach(
						( _attrValue: unknown, attrName: string ) => {
							if ( ! value.hasOwnProperty( attrName ) ) {
								currentAttributes.delete( attrName );
							}
						}
					);

					break;
				}

				case 'innerBlocks': {
					// Recursively merge innerBlocks
					const yInnerBlocks = yblock.get( key ) as Y.Array< YBlock >;
					mergeCrdtBlocks( yInnerBlocks, value ?? [], lastSelection );
					break;
				}

				default:
					if ( ! fastDeepEqual( block[ key ], yblock.get( key ) ) ) {
						yblock.set( key, value );
					}
			}
		} );
		yblock.forEach( ( _v, k ) => {
			if ( ! block.hasOwnProperty( k ) ) {
				yblock.delete( k );
			}
		} );
	}

	// deletes
	yblocks.delete( left, numOfDeletionsNeeded );

	// inserts
	for ( let i = 0; i < numOfInsertionsNeeded; i++, left++ ) {
		const newBlock = [ createNewYBlock( blocksToSync[ left ] ) ];

		yblocks.insert( left, newBlock );
	}

	// remove duplicate clientids
	const knownClientIds = new Set< string >();
	for ( let j = 0; j < yblocks.length; j++ ) {
		const yblock: YBlock = yblocks.get( j );

		let clientId: string = yblock.get( 'clientId' ) as string;

		if ( knownClientIds.has( clientId ) ) {
			clientId = uuidv4();
			yblock.set( 'clientId', clientId );
		}
		knownClientIds.add( clientId );
	}
}

/**
 * Determine if a block should be synced.
 *
 * Ex: A gallery block should not be synced until the images have been
 * uploaded to WordPress, and their url is available. Before that,
 * it's not possible to access the blobs on a client as those are
 * local.
 *
 * @param block The block to check.
 * @return True if the block should be synced, false otherwise.
 */
function shouldBlockBeSynced( block: Block ): boolean {
	// Verify that the gallery block is ready to be synced.
	// This means that, all images have had their blobs converted to full URLs.
	// Checking for only the blobs ensures that blocks that have just been inserted work as well.
	if ( 'core/gallery' === block.name ) {
		return ! block.innerBlocks.some(
			( innerBlock ) =>
				innerBlock.attributes && innerBlock.attributes.blob
		);
	}

	// Allow all other blocks to be synced.
	return true;
}

// Cache rich-text attributes for all block types.
let cachedRichTextAttributes: Map< string, Map< string, true > >;

/**
 * Given a block name and attribute key, return true if the attribute is rich-text typed.
 *
 * @param blockName     The name of the block, e.g. 'core/paragraph'.
 * @param attributeName The name of the attribute to check, e.g. 'content'.
 * @return True if the attribute is rich-text typed, false otherwise.
 */
function isRichTextAttribute(
	blockName: string,
	attributeName: string
): boolean {
	if ( ! cachedRichTextAttributes ) {
		// Parse the attributes for all blocks once.
		cachedRichTextAttributes = new Map< string, Map< string, true > >();

		for ( const blockType of getBlockTypes() as BlockType[] ) {
			const richTextAttributeMap = new Map< string, true >();

			for ( const [ name, definition ] of Object.entries(
				blockType.attributes ?? {}
			) ) {
				if ( 'rich-text' === definition.type ) {
					richTextAttributeMap.set( name, true );
				}
			}

			cachedRichTextAttributes.set(
				blockType.name,
				richTextAttributeMap
			);
		}
	}

	return (
		cachedRichTextAttributes.get( blockName )?.has( attributeName ) ?? false
	);
}

/**
 * Given a Y.Text object and an updated string value, diff the new value and
 * apply the delta to the Y.Text.
 *
 * @param blockYText    The Y.Text to update.
 * @param updatedValue  The updated value.
 * @param lastSelection The last cursor position before this update, used to hint the diff algorithm.
 */
function mergeRichTextUpdate(
	blockYText: Y.Text,
	updatedValue: string,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	lastSelection: WPBlockSelection | null
): void {
	// TODO
	// ====
	// Gutenberg does not use Yjs shared types natively, so we can only subscribe
	// to changes from store and apply them to Yjs types that we create and
	// manage. Crucially, for rich-text attributes, we do not receive granular
	// string updates; we get the new full string value on each change, even when
	// only a single character changed.
	//
	// The code below allows us to compute a delta between the current and new
	// value, then apply it to the Y.Text. However, it relies on a library
	// (quill-delta) with a licensing issue that we are working to resolve.
	//
	// For now, we simply replace the full text content on each change.
	//
	// if ( ! localDoc ) {
	// 	// Y.Text must be attached to a Y.Doc to be able to do operations on it.
	// 	// Create a temporary Y.Text attached to a local Y.Doc for delta computation.
	// 	localDoc = new Y.Doc();
	// }

	// const localYText = localDoc.getText( 'temporary-text' );
	// localYText.delete( 0, localYText.length );
	// localYText.insert( 0, updatedValue );

	// const currentValueAsDelta = new Delta( blockYText.toDelta() );
	// const updatedValueAsDelta = new Delta( localYText.toDelta() );

	// const deltaDiff = currentValueAsDelta.diff(
	// 	updatedValueAsDelta,
	// 	lastSelection?.offset
	// );

	// blockYText.applyDelta( deltaDiff.ops );

	blockYText.delete( 0, blockYText.toString().length );
	blockYText.insert( 0, updatedValue );
}
