/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

const DIRECTION_IN = 'in';
const DIRECTION_OUT = 'out';
function flipDirection( direction ) {
	return direction === DIRECTION_IN ? DIRECTION_OUT : DIRECTION_IN;
}

function createBlockClientIdManager( shouldMapBlocks ) {
	const clientIdMap = { [ DIRECTION_IN ]: {}, [ DIRECTION_OUT ]: {} };

	const mapBlocks = ( blocks, direction ) => {
		if ( ! Array.isArray( blocks ) || ! shouldMapBlocks ) {
			return blocks;
		}

		return blocks.map( ( block ) => ( {
			...block,
			innerBlocks: mapBlocks( block.innerBlocks, direction ),
			clientId: mapBlockId( block.clientId, direction ),
		} ) );
	};

	const mapBlockId = ( blockClientId, direction ) => {
		// Avoid running map code on non-string clientIds. There appear to be times
		// where this function can be called with `blockClientId = {}`
		if ( typeof blockClientId !== 'string' || ! shouldMapBlocks ) {
			return blockClientId;
		}

		if ( ! clientIdMap[ direction ][ blockClientId ] ) {
			const newId = uuid();
			clientIdMap[ direction ][ blockClientId ] = newId;
			clientIdMap[ flipDirection( direction ) ][ newId ] = blockClientId;
		}
		return clientIdMap[ direction ][ blockClientId ];
	};

	return {
		updateOutgoingBlocks: ( blocks ) => mapBlocks( blocks, DIRECTION_OUT ),
		updateIncomingBlocks: ( blocks ) => mapBlocks( blocks, DIRECTION_IN ),
		getOutgoingBlockId: ( blockId ) => mapBlockId( blockId, DIRECTION_OUT ),
		getIncomingBlockId: ( blockId ) => mapBlockId( blockId, DIRECTION_IN ),
	};
}

const _instanceReference = {};
export default function useBlockManager( entityId ) {
	const manager = useRef(
		createBlockClientIdManager( !! _instanceReference[ entityId ] )
	);

	const entityIdRef = useRef( entityId );
	if ( entityIdRef.current ) {
		_instanceReference[ entityIdRef.current ] = true;
	}

	useEffect( () => {
		if ( ! entityId ) {
			entityIdRef.current = null;
			return;
		}
		if ( ! _instanceReference[ entityId ] ) {
			_instanceReference[ entityId ] = true;
			manager.current = createBlockClientIdManager( false );
		} else {
			manager.current = createBlockClientIdManager( true );
		}
		entityIdRef.current = entityId;
	}, [ entityId ] );

	return manager.current;
}
