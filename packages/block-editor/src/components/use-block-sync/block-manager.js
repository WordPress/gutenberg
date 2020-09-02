/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	setupEntityInstance,
	isDuplicateEntityInstance,
	removeEntityInstance,
} from './entity-instances';

class BlockManager {
	static _DIRECTION_IN = 'in';
	static _DIRECTION_OUT = 'out';

	constructor( entityId, instanceId ) {
		this._entityId = entityId;
		this._instanceId = instanceId;
		this._blockIdMap = {
			in: {},
			out: {},
		};
		setupEntityInstance( entityId, instanceId );
	}

	// If needed, map to new outgoing IDs.
	updateOutgoingBlocks( blocks ) {
		return this._mapBlocks( blocks, this._DIRECTION_OUT );
	}

	// If needed, map to new incoming IDs.
	updateIncomingBlocks( blocks ) {
		return this._mapBlocks( blocks, this._DIRECTION_IN );
	}

	// Get the mapped ID for an outgoing block directly.
	getOutgoingBlockId( blockClientId ) {
		return this._mapBlockId( blockClientId, this._DIRECTION_OUT );
	}

	// Get the mapped ID for an incoming block directly.
	getIncomingBlockId( blockClientId ) {
		return this._mapBlockId( blockClientId, this._DIRECTION_IN );
	}

	destroy() {
		removeEntityInstance( this._entityId, this._instanceId );
	}

	_isDuplicateInstance() {
		return isDuplicateEntityInstance( this._entityId, this._instanceId );
	}

	_mapBlocks( blocks, direction ) {
		if ( ! Array.isArray( blocks ) || ! this._isDuplicateInstance() ) {
			return blocks;
		}
		return blocks.map( ( block ) => ( {
			...block,
			innerBlocks: this._mapBlocks( block.innerBlocks, direction ),
			clientId: this._mapBlockId( block.clientId, direction ),
		} ) );
	}

	_mapBlockId( blockClientId, direction ) {
		// Avoid running map code on non-string clientIds. There appear to be times
		// where this function can be called with `blockClientId = {}`
		if (
			typeof blockClientId !== 'string' ||
			! this._isDuplicateInstance()
		) {
			return blockClientId;
		}

		if ( ! this._blockIdMap[ direction ][ blockClientId ] ) {
			const newId = uuid();
			this._blockIdMap[ direction ][ blockClientId ] = newId;
			this._blockIdMap[ this._flipDirection( direction ) ][
				newId
			] = blockClientId;
		}
		return this._blockIdMap[ direction ][ blockClientId ];
	}

	_flipDirection( direction ) {
		return direction === this._DIRECTION_IN
			? this._DIRECTION_OUT
			: this._DIRECTION_IN;
	}
}

export default function useBlockManager( entityId ) {
	const instanceId = useRef( uuid() ).current;
	const managerInstance = useRef( new BlockManager( entityId, instanceId ) );

	useEffect( () => {
		managerInstance.current.destroy();
		managerInstance.current = new BlockManager( entityId, instanceId );
		return () => managerInstance.current.destroy();
	}, [ instanceId, entityId ] );

	return managerInstance.current;
}
