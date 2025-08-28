/**
 * External dependencies
 */
import { v4 as uuidv4 } from 'uuid';
import * as math from 'lib0/math';
import * as fun from 'lib0/function';

/**
 * WordPress dependencies
 */
import { RichTextData } from '@wordpress/rich-text';
import { Y } from '@wordpress/sync';

interface BlockAttributes {
	[ key: string ]: unknown;
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
	| Y.Map< unknown >
	/* innerBlocks is a Y.Array< YBlock >. */
	| Y.Array< YBlock >
>;

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

function makeBlocksSerializable(
	blocks: Block[] | Y.Array< YBlock >
): Block[] {
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
	const res = fun.equalityDeep(
		Object.assign( {}, gblock, overwrites ),
		Object.assign( {}, yblockAsJson, overwrites )
	);
	const inners = gblock.innerBlocks || [];
	const yinners = yblockAsJson.innerBlocks || [];
	return (
		res &&
		inners.length === yinners.length &&
		inners.every( ( block: Block, i: number ) =>
			areBlocksEqual( block, yinners[ i ] )
		)
	);
}

function createNewYBlock( block: Block ): YBlock {
	return new Y.Map(
		Object.entries( block ).map( ( [ key, value ] ) => {
			switch ( key ) {
				case 'innerBlocks': {
					if ( Array.isArray( value ) ) {
						const innerBlocks = new Y.Array();

						innerBlocks.insert(
							0,
							value.map( ( innerBlock: Block ) =>
								createNewYBlock( innerBlock )
							)
						);

						return [ key, innerBlocks ];
					}

					return [ key, value ];
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
 * @param incomingBlocks Gutenberg blocks being synced.
 * @param _origin        The origin of the sync, either 'syncProvider.getInitialCRDTDoc' or 'gutenberg'.
 */

export function mergeCrdtBlocks(
	yblocks: Y.Array< YBlock >, // yblocks represent the blocks in the local Y.Doc
	incomingBlocks: Block[], // incomingBlocks represent JSON blocks being synced, either from a peer or from the local editor
	_origin: string // eslint-disable-line @typescript-eslint/no-unused-vars
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
	const numOfCommonEntries = math.min(
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
	const numOfInsertionsNeeded = math.max(
		0,
		blocksToSync.length - yblocks.length
	);
	const numOfDeletionsNeeded = math.max(
		0,
		yblocks.length - blocksToSync.length
	);

	// updates
	for ( let i = 0; i < numOfUpdatesNeeded; i++, left++ ) {
		const block = blocksToSync[ left ];
		const yblock = yblocks.get( left );
		Object.entries( block ).forEach( ( [ k, v ] ) => {
			if ( ! fun.equalityDeep( block[ k ], yblock.get( k ) ) ) {
				if ( k === 'innerBlocks' ) {
					// Recursively merge innerBlocks
					const yInnerBlocks = yblock.get( k ) as Y.Array< YBlock >;

					mergeCrdtBlocks( yInnerBlocks, v, _origin );
				}

				yblock.set( k, v );
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
