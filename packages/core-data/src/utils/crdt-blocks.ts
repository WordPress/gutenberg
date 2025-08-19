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

interface Block {
	attributes: BlockAttributes;
	clientId?: string;
	innerBlocks: Block[];
	originalContent?: string; // unserializable
	validationIssues?: string[]; // unserializable
}

// The Y.Map type is not easy to work with. The generic type it accepts represents
// the possible values of the map, which are varied in our case. This type is
// accurate, but will require aggressive type narrowing when the map values are
// accessed -- or type casting with `as`.
type YBlock = Y.Map< Block[ keyof Block ] >;

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
		const { innerBlocks, attributes, ...rest } = blockAsJson;
		delete rest.validationIssues;
		delete rest.originalContent;
		// delete rest.isValid
		return {
			...rest,
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

	// we must not sync clientId, as this can't be generated consistenctly and
	// hence will lead to merge conflicts.
	const overwrites = {
		innerBlocks: null,
		clientId: null,
	};
	const res = fun.equalityDeep(
		Object.assign( {}, gblock, overwrites ),
		Object.assign( {}, yblock, overwrites )
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

export function mergeBlocks(
	yblocks: Y.Array< YBlock >,
	newValue: Block[] | Y.Array< YBlock >,
	_origin: string // eslint-disable-line @typescript-eslint/no-unused-vars
): void {
	// Ensure we are working with serializable block data.
	if ( ! serializableBlocksCache.has( newValue ) ) {
		serializableBlocksCache.set(
			newValue,
			makeBlocksSerializable( newValue )
		);
	}
	const blocks = serializableBlocksCache.get( newValue ) ?? [];

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

	const numOfCommonEntries = math.min( blocks.length ?? 0, yblocks.length );

	let left = 0;
	let right = 0;

	// skip equal blocks from left
	for (
		;
		left < numOfCommonEntries &&
		areBlocksEqual( blocks[ left ], yblocks.get( left ) );
		left++
	) {
		/* nop */
	}

	// skip equal blocks from right
	for (
		;
		right < numOfCommonEntries - left &&
		areBlocksEqual(
			blocks[ blocks.length - right - 1 ],
			yblocks.get( yblocks.length - right - 1 )
		);
		right++
	) {
		/* nop */
	}

	const numOfUpdatesNeeded = numOfCommonEntries - left - right;
	const numOfInsertionsNeeded = math.max( 0, blocks.length - yblocks.length );
	const numOfDeletionsNeeded = math.max( 0, yblocks.length - blocks.length );

	// updates
	for ( let i = 0; i < numOfUpdatesNeeded; i++, left++ ) {
		const block = blocks[ left ];
		const yblock = yblocks.get( left );
		Object.entries( block ).forEach( ( [ k, v ] ) => {
			if ( ! fun.equalityDeep( block[ k ], yblock.get( k ) ) ) {
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
		yblocks.insert( left, [
			new Y.Map< Block[ keyof Block ] >(
				Object.entries( blocks[ left ] )
			),
		] );
	}

	// remove duplicate clientids
	const knownClientIds = new Set< string >();
	for ( let j = 0; j < yblocks.length; j++ ) {
		const yblock: Y.Map< Block[ keyof Block ] > = yblocks.get( j );

		let clientId: string = yblock.get( 'clientId' ) as string;

		if ( knownClientIds.has( clientId ) ) {
			clientId = uuidv4();
			yblock.set( 'clientId', clientId );
		}
		knownClientIds.add( clientId );
	}
}
