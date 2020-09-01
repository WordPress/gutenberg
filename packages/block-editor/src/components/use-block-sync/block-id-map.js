/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * Internal dependencies
 */
import { DIRECTION_IN, DIRECTION_OUT } from './constants';

const BLOCK_ID_MAP = {};

function initBlockMap( instanceId ) {
	if ( ! BLOCK_ID_MAP[ instanceId ] ) {
		BLOCK_ID_MAP[ instanceId ] = {
			[ DIRECTION_IN ]: {}, // entity => local
			[ DIRECTION_OUT ]: {}, // local => entity
		};
	}
}

function flipDirection( direction ) {
	return direction === DIRECTION_IN ? DIRECTION_OUT : DIRECTION_IN;
}

export function mapBlockId( blockClientId, instanceId, direction ) {
	// Avoid running map code on non-string clientIds. There appear to be times
	// where this function can be called with `blockClientId = {}`
	if ( typeof blockClientId !== 'string' ) {
		return blockClientId;
	}
	initBlockMap( instanceId );
	if ( ! BLOCK_ID_MAP[ instanceId ][ direction ][ blockClientId ] ) {
		const newId = uuid();
		BLOCK_ID_MAP[ instanceId ][ direction ][ blockClientId ] = newId;
		BLOCK_ID_MAP[ instanceId ][ flipDirection( direction ) ][
			newId
		] = blockClientId;
	}
	return BLOCK_ID_MAP[ instanceId ][ direction ][ blockClientId ];
}

export function mapBlocks( blocks, instanceId, direction ) {
	initBlockMap( instanceId );
	return blocks.map( ( block ) => ( {
		...block,
		innerBlocks: mapBlocks( block.innerBlocks, instanceId, direction ),
		clientId: mapBlockId( block.clientId, instanceId, direction ),
	} ) );
}
